import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  CreateJobDto,
  ScheduleInterviewDto,
  UpdateApplicationStatusDto,
  UpdateJobDto,
  UpdateInterviewStatusDto,
} from './dto/employer.dto';
import { UpdateEmployerProfileDto, ChangePasswordDto } from './dto/employer-profile.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserRole } from 'src/generated/prisma/client';
import { MailService } from 'src/admin/admin-mail/mail.service';


@Injectable()
export class EmployerService {
  private readonly ANONYMOUS_IMAGE = '/uploads/anonymous.png';
  constructor(
    private prisma: PrismaService,
    private notificationService: FirebaseService,
    private mailService: MailService,
  ) { }

  // ==================================================
  // 1. DASHBOARD STATS
  // ==================================================
  async getDashboardStats(userId: string) {
    const employerId = await this.getEmployerId(userId);

    const activeJobs = await this.prisma.job.count({
      where: { employerId, status: 'OPEN' },
    });

    const pendingApplicants = await this.prisma.application.count({
      where: {
        job: { employerId },
        status: { in: ['APPLIED', 'VIEWED'] },
      },
    });

    const interviewsScheduled = await this.prisma.interview.count({
      where: {
        application: { job: { employerId } },
        status: { in: ['SCHEDULED', 'COMPLETED'] },
      },
    });

    const hiresCompleted = await this.prisma.application.count({
      where: {
        job: { employerId },
        status: 'HIRED',
      },
    });

    return { activeJobs, pendingApplicants, interviewsScheduled, hiresCompleted };
  }




  async getInterviewDetails(userId: string, interviewId: string) {
    const employerId = await this.getEmployerId(userId); // ✅ getProfileId → getEmployerId

    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          job: { employerId }, // ✅ employer দিয়ে ownership check
        },
      },
      include: {
        application: {
          include: {
            job: true,
          },
        },
        payment: true,
      },
    });

    if (!interview) throw new NotFoundException('Interview not found or access denied');

    const job = interview.application.job;

    return {
      interviewId: interview.id,
      status: interview.status,
      scheduleDate: interview.scheduleDate,
      scheduleTime: interview.scheduleTime,
      interviewType: interview.interviewType,
      duration: interview.duration,
      meetingLink: interview.meetingLink,
      notes: interview.notes,
      createdAt: interview.createdAt,
      editedAt: interview.editedAt,
      payment: interview.payment
        ? {
          status: interview.payment.status,
          amount: interview.payment.amount,
          paidAt: interview.payment.createdAt,
        }
        : null,
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salaryAmount: job.salaryAmount,
        salaryFrequency: job.salaryFrequency,
      },
      application: {
        id: interview.application.id,
        status: interview.application.status,
        appliedAt: interview.application.createdAt,
      },
    };
  }
  // ==================================================
  // 2. POST A JOB
  // ==================================================
  async createJob(userId: string, dto: CreateJobDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const employerId = await this.getEmployerId(userId);

    if (user?.role === UserRole.COMPANY) {
      await this.pauseOpenJobsIfSubscriptionExpired(employerId);

      const sub = await this.prisma.employerSubscription.findFirst({
        where: {
          employerId,
          isActive: true,
          expiryDate: { gt: new Date() },
        },
        include: { plan: true },
      });

      if (!sub) {
        throw new ForbiddenException('Active subscription required to post jobs');
      }

      const activeJobs = await this.prisma.job.count({
        where: { employerId, status: 'OPEN' },
      });

      if (activeJobs >= sub.plan.slotsAvailable) {
        throw new ForbiddenException(
          `Your plan allows only ${sub.plan.slotsAvailable} active job(s)`
        );
      }
    }

    const createdJob = await this.prisma.job.create({
      data: {
        employerId,
        title: dto.title,
        categories: {
          connect: dto.categoryIds.map(id => ({ id })),
        },
        jobType: dto.jobType,
        location: dto.location,
        workTime: dto.workTime ?? [],
        isRemote: dto.isRemote ?? false,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        numberOfEmployees: dto.numberOfEmployees,
        description: dto.description,
        responsibilities: dto.responsibilities ?? [],
        benefits: dto.benefits ?? [],
        experienceLevel: dto.experienceLevel,
        minExperience: dto.minExperience,
        educationLevel: dto.educationLevel,
        salaryType: dto.salaryType,
        salaryFrequency: dto.salaryFrequency,
        salaryAmount: dto.salaryAmount,
        isAnonymous: dto.isAnonymous ?? false,
        status: 'OPEN',
      },
      include: {
        categories: { select: { id: true } },
        employer: { select: { fullName: true, companyName: true, profilePic: true } },
      },
    }).then(job => ({
      ...job,
      displayImage: job.isAnonymous ? this.ANONYMOUS_IMAGE : job.employer?.profilePic ?? null,
      employer: job.isAnonymous
        ? { fullName: 'Anonymous', companyName: 'Anonymous' }
        : job.employer,
    }));


    await this.notifyMatchingJobSeekers(createdJob.id, dto.categoryIds, createdJob, userId);


    return createdJob;
  }
  // ==================================================
  // 3. MY POSTED JOBS (with pagination + search)
  // ==================================================
  async getMyJobs(
    userId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
    },
  ) {
    const { page, limit, search } = params;
    const employerId = await this.getEmployerId(userId);
    const skip = (page - 1) * limit;

    const where: any = { employerId };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [total, jobs] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        workTime: job.workTime,
        salary: job.salaryAmount,
        salaryFrequency: job.salaryFrequency,
        type: job.jobType,
        status: job.status,
        experienceLevel: job.experienceLevel,
        totalApplicants: job._count.applications,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ==================================================
  // 3b. GET SINGLE JOB DETAILS
  // ==================================================
  async getJobById(userId: string, jobId: string) {
    const employerId = await this.getEmployerId(userId);

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
      include: {
        categories: { select: { id: true } },
        employer: {
          select: {
            fullName: true,
            companyName: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) throw new NotFoundException('Job not found or access denied');

    const { employer, ...jobData } = job;

    return {
      ...jobData,
      companyName: job.isAnonymous ? 'Anonymous' : (employer?.companyName ?? employer?.fullName ?? ''),
      displayImage: job.isAnonymous ? this.ANONYMOUS_IMAGE : null,
    };
  }

  // ==================================================
  // 3c. UPDATE JOB
  // ==================================================
  async updateJob(userId: string, jobId: string, dto: UpdateJobDto) {
    const employerId = await this.getEmployerId(userId);

    const existingJob = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
    });

    if (!existingJob) throw new NotFoundException('Job not found or access denied');

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: dto.title,
        ...(dto.categoryIds && {
          categories: {
            set: [],
            connect: dto.categoryIds.map(id => ({ id })),
          },
        }),
        jobType: dto.jobType,
        location: dto.location,
        workTime: dto.workTime,
        isRemote: dto.isRemote,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        numberOfEmployees: dto.numberOfEmployees,
        description: dto.description,
        responsibilities: dto.responsibilities,
        benefits: dto.benefits,
        experienceLevel: dto.experienceLevel,
        minExperience: dto.minExperience,
        educationLevel: dto.educationLevel,
        salaryType: dto.salaryType,
        salaryFrequency: dto.salaryFrequency,
        salaryAmount: dto.salaryAmount,
        isAnonymous: dto.isAnonymous,
        status: dto.status,
      },
      include: {
        categories: { select: { id: true } },
      },
    });
  }

  // ==================================================
  // 3d. DELETE JOB
  // ==================================================
  async deleteJob(userId: string, jobId: string) {
    const employerId = await this.getEmployerId(userId);

    const existingJob = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
    });

    if (!existingJob) throw new NotFoundException('Job not found or access denied');

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      select: { id: true },
    });

    const applicationIds = applications.map((a) => a.id);

    // payment → interview → application → savedJob → report → job
    await this.prisma.payment.deleteMany({
      where: { interview: { applicationId: { in: applicationIds } } },
    });

    await this.prisma.interview.deleteMany({
      where: { applicationId: { in: applicationIds } },
    });

    await this.prisma.application.deleteMany({ where: { jobId } });

    await this.prisma.savedJob.deleteMany({ where: { jobId } });

    await this.prisma.report.deleteMany({ where: { jobId } });

    await this.prisma.job.delete({ where: { id: jobId } });

    return { message: 'Job deleted successfully' };
  }

  // ==================================================
  // 4. GET APPLICANTS FOR A JOB
  // ==================================================
  async getJobApplicants(
    userId: string,
    jobId: string,
    params: {
      page: number;
      limit: number;
    },
  ) {
    const employerId = await this.getEmployerId(userId);
    const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
    const limit = Number.isFinite(params.limit) && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
      select: {
        id: true,
        title: true,
        employer: {
          select: {
            fullName: true,
            companyName: true,
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found or access denied');

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where: { jobId } }),
      this.prisma.application.findMany({
        where: { jobId },
        skip,
        take: limit,
        include: {
          jobSeeker: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              profilePic: true,
              about: true,
              location: true,
              experienceLevel: true,
              skills: true,
              resumeUrl: true,
              idCardFront: true,
              idCardBack: true,
              selfieImage: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true,
                  isVerified: true,
                },
              },
              education: true,
              experience: true,
            },
          },
          interview: {
            include: {
              payment: {
                select: {
                  status: true,
                  candidateCompletedAt: true,
                  employerCompletedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: applications.map((application) => this.formatApplicantResponse(application)),
      jobInfo: {
        id: job.id,
        title: job.title,
      },
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ==================================================
  // 4b. GET APPLICANTS FOR ALL EMPLOYER JOBS (pagination + filter)
  // ==================================================
  async getAllApplicants(
    userId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      filter?: string;
    },
  ) {
    const employerId = await this.getEmployerId(userId);

    const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
    const limit = Number.isFinite(params.limit) && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      job: { employerId },
    };

    if (params.search) {
      where.OR = [
        { jobSeeker: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { job: { title: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const filter = (params.filter ?? 'ALL').toUpperCase();
    if (filter === 'PENDING' || filter === 'APPLIED' || filter === 'VIEWED') {
      where.status = { in: ['APPLIED', 'VIEWED'] };
    } else if (filter === 'SCHEDULED') {
      where.interview = { is: { status: { in: ['SCHEDULED', 'COMPLETED'] } } };
    } else if (filter === 'HIRED') {
      where.status = 'HIRED';
      where.interview = { is: { payment: { is: { status: 'PAID' } } } };
    } else if (filter === 'PAID') {
      where.interview = { is: { payment: { is: { status: 'PAID' } } } };
    }

    const [total, applications, pendingApplicants, scheduledApplicants, hiredApplicants] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          jobSeeker: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                },
              },
              fullName: true,
              profilePic: true,
              experienceLevel: true,
              location: true,
              experience: {
                select: {
                  designation: true,
                },
                take: 1,
                orderBy: { startDate: 'desc' },
              },
            },
          },
          interview: {
            select: {
              id: true,
              status: true,
              scheduleDate: true,
              scheduleTime: true,
              interviewType: true,
              payment: {
                select: {
                  status: true,
                  candidateCompletedAt: true,
                  employerCompletedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({
        where: {
          job: { employerId },
          status: { in: ['APPLIED', 'VIEWED'] },
        },
      }),
      this.prisma.application.count({
        where: {
          job: { employerId },
          interview: { is: { status: { in: ['SCHEDULED', 'COMPLETED'] } } },
        },
      }),
      this.prisma.application.count({
        where: {
          job: { employerId },
          status: 'HIRED',
          interview: { is: { payment: { is: { status: 'PAID' } } } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: applications.map((application) => this.formatFilteredApplicantResponse(application)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary: {
        pendingApplicants,
        scheduledApplicants,
        hiredApplicants,
      },
    };
  }

  private formatFilteredApplicantResponse(application: any) {
    const latestExperience = Array.isArray(application.jobSeeker?.experience)
      ? application.jobSeeker.experience[0]
      : null;

    return {
      appId: application.id,
      jobId: application.jobId,
      interviewId: application.interview?.id ?? null,
      applicationStatus: application.status,
      interviewStatus: application.interview?.status ?? null,
      interviewTime: application.interview?.scheduleTime ?? null,
      interviewType: application.interview?.interviewType ?? null,
      paymentStatus: application.interview?.payment?.status ?? null,
      candidateCompletedAt: application.interview?.payment?.candidateCompletedAt ?? null,
      employerCompletedAt: application.interview?.payment?.employerCompletedAt ?? null,
      appliedDate: application.createdAt,
      experienceLevel: application.jobSeeker?.experienceLevel ?? null,
      userInfo: application.jobSeeker
        ? {
          userId: application.jobSeeker.user?.id ?? null,
          id: application.jobSeeker.id,
          fullName: application.jobSeeker.fullName,
          profilePic: application.jobSeeker.profilePic,
          experienceLevel: application.jobSeeker.experienceLevel,
          designation: latestExperience?.designation ?? null,
        }
        : null,
    };
  }

  // ==================================================
  // 6. SCHEDULE INTERVIEW
  // ==================================================
async scheduleInterview(userId: string, applicationId: string, dto: ScheduleInterviewDto) {
  const employerId = await this.getEmployerId(userId);

  const application = await this.prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          employer: true, 
        },
      },
      jobSeeker: true,
    },
  });

  if (!application) throw new NotFoundException('Application not found');
  if (application.job.employerId !== employerId) {
    throw new ForbiddenException('You are not authorized for this application');
  }

  const interview = await this.prisma.interview.upsert({
    where: { applicationId },
    update: {
      // scheduleDate: new Date(`${dto.scheduleDate}T00:00:00-05:00`),
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      interviewType: dto.interviewType,
      duration: dto.duration,
      meetingLink: dto.meetingLink,
      notes: dto.notes,
      status: 'SCHEDULED',
      editedAt: new Date(),
    },
    create: {
      applicationId,
      // scheduleDate: new Date(`${dto.scheduleDate}T00:00:00-05:00`),
      scheduleDate: dto.scheduleDate,
      scheduleTime: dto.scheduleTime,
      interviewType: dto.interviewType,
      duration: dto.duration,
      meetingLink: dto.meetingLink,
      notes: dto.notes,
      status: 'SCHEDULED',
    },
  });

  await this.prisma.application.update({
    where: { id: applicationId },
    data: { status: 'INTERVIEW' },
  });

  await this.notificationService.createNotification(
    application.jobSeeker.userId,
    'Interview Scheduled',
    `Your interview for ${application.job.title} has been scheduled on ${dto.scheduleDate}.`,
    'INTERVIEW',
    userId,
  );

  const seekerUser = await this.prisma.user.findUnique({
    where: { id: application.jobSeeker.userId },
    select: { email: true },
  });

  if (seekerUser?.email) {
    await this.mailService.sendInterviewInvitationMail(
      seekerUser.email,
      application.jobSeeker.fullName ?? 'Candidate',
      application.job.isAnonymous
        ? 'Anonymous'
        : (application.job.employer?.companyName ?? 'Company'),  // ← now valid
      application.job.title,
      dto.scheduleDate,
      dto.scheduleTime ?? '',   // ← string | undefined → string
      dto.interviewType ?? 'Online',
      dto.meetingLink ?? '',
    );
  }

  return interview;
}

  // ==================================================
  // 7. UPDATE APPLICATION STATUS — FIX
  // ==================================================
  async updateApplicationStatus(userId: string, applicationId: string, dto: UpdateApplicationStatusDto) {
    const employerId = await this.getEmployerId(userId);

    const existing = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { employerId },
      },
    });
    if (!existing) throw new NotFoundException('Application not found or access denied');

    const application = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: dto.status },
      include: {
        job: true,
        jobSeeker: true,
      },
    });

    if (dto.status === 'HIRED') {
      await this.notificationService.createNotification(
        application.jobSeeker.userId,
        'Congratulations! You are Hired 🎉',
        `You have been hired for ${application.job.title}.`,
        'HIRED',
        userId,
      );
    }

    if (dto.status === 'REJECTED') {
      await this.notificationService.createNotification(
        application.jobSeeker.userId,
        'Application Update',
        `Your application for ${application.job.title} was not selected.`,
        'REJECTED',
        userId,
      );
    }

    return application;
  }

  // ==================================================
  // 9. UPDATE INTERVIEW — FIX
  // ==================================================
  async updateInterview(userId: string, interviewId: string, dto: ScheduleInterviewDto) {
    const employerId = await this.getEmployerId(userId);

    // ✅ ownership check
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          job: { employerId },
        },
      },
    });
    if (!interview) throw new NotFoundException('Interview not found or access denied');

    return this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduleDate: dto.scheduleDate ? new Date(`${dto.scheduleDate}T00:00:00-05:00`) : undefined,
        scheduleTime: dto.scheduleTime,
        interviewType: dto.interviewType,
        duration: dto.duration,
        meetingLink: dto.meetingLink,
        notes: dto.notes,
        editedAt: new Date(),
      },
    });
  }

  // ==================================================
  // 9b. UPDATE INTERVIEW STATUS
  // ==================================================
  async updateInterviewStatus(userId: string, interviewId: string, dto: UpdateInterviewStatusDto) {
    const employerId = await this.getEmployerId(userId);

    const existingInterview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          job: { employerId },
        },
      },
      include: {
        application: {
          include: {
            job: true,
            jobSeeker: true,
          },
        },
      },
    });

    if (!existingInterview) {
      throw new NotFoundException('Interview not found or access denied');
    }

    const interview = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: dto.status,
        editedAt: new Date(),
      },
      include: {
        application: {
          include: {
            job: true,
            jobSeeker: true,
          },
        },
      },
    });

    if (dto.status === 'HIRED') {
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: 'HIRED' },
      });

      await this.notificationService.createNotification(
        interview.application.jobSeeker.userId,
        'Congratulations! You are Hired',
        `You have been hired for ${interview.application.job.title}.`,
        'HIRED',
        userId,
      );
    }

    if (dto.status === 'REJECTED') {
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: 'REJECTED' },
      });

      await this.notificationService.createNotification(
        interview.application.jobSeeker.userId,
        'Interview Update',
        `Your interview outcome for ${interview.application.job.title} is marked as not selected.`,
        'REJECTED',
        userId,
      );
    }

    if (dto.status === 'SCHEDULED' || dto.status === 'COMPLETED') {
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: 'INTERVIEW' },
      });
    }

    return interview;
  }

  // ==================================================
  // GET PROFILE
  // ==================================================
  async getProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const subscription = profile.subscription
      ? {
          ...profile.subscription,
          planName: profile.subscription.plan?.name ?? null,
          price: profile.subscription.plan?.price ?? null,
          duration: profile.subscription.plan?.duration ?? null,
          slotsAvailable: profile.subscription.plan?.slotsAvailable ?? null,
          features: profile.subscription.plan?.features ?? [],
          effectiveSlotsAvailable:
            profile.subscription.slotsOverride ?? profile.subscription.plan?.slotsAvailable ?? null,
          remainingDays: Math.ceil(
            (new Date(profile.subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        }
      : null;

    return {
      ...profile,
      subscription,
    };
  }

  // ==================================================
  // UPDATE PROFILE
  // ==================================================
  async updateProfile(
    userId: string,
    dto: UpdateEmployerProfileDto,
    profilePic?: string | null,
    licenseFile?: string | null,
  ) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.employerProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        companyName: dto.companyName,
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        website: dto.website,
        businessRegCertId: dto.businessRegCertId,
        taxId: dto.taxId,
        authorizedRepId: dto.authorizedRepId,
        profilePic: profilePic ?? undefined,
        licenseFile: licenseFile ?? undefined,
      },
    });
  }

  // ==================================================
  // CHANGE PASSWORD
  // ==================================================
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  // ==================================================
  // SYSTEM CONTENT
  // ==================================================
  async getSystemContent(key: string) {
    const content = await this.prisma.systemContent.findUnique({
      where: { key },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  // ==================================================
  // DELETE ACCOUNT
  // ==================================================
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }

  // ==================================================
  // HELPER 
  // ==================================================
  private async getEmployerId(userId: string): Promise<string> {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Employer Profile not found');
    return profile.id;
  }

  private async pauseOpenJobsIfSubscriptionExpired(employerId: string) {
    const expired = await this.prisma.employerSubscription.updateMany({
      where: {
        employerId,
        isActive: true,
        expiryDate: { lte: new Date() },
      },
      data: { isActive: false },
    });

    if (expired.count > 0) {
      await this.prisma.job.updateMany({
        where: {
          employerId,
          status: 'OPEN',
        },
        data: { status: 'PAUSED' },
      });
    }
  }

  private formatApplicantResponse(application: any) {
    const experiences = Array.isArray(application.jobSeeker?.experience)
      ? application.jobSeeker.experience
      : [];
    const currentExperience = experiences[0] ?? null;

    const {
      refJobName,
      refJobCompany,
      refJobTitle,
      refJobRelationship,
      refJobPhone,
      refJobEmail,
      refJpName,
      refJpContact,
      refJpJurisdiction,
      refJpRelationship,
      refPastorName,
      refPastorChurch,
      refPastorContact,
      refPastorRelationship,
      refRelativeName,
      refRelativeContact,
      refRelativeRelationship,
      ...applicationWithoutRefs
    } = application;

    return {
      ...applicationWithoutRefs,
      paymentStatus: application.interview?.payment?.status === 'PAID',
      references: {
        previousJob: {
          name: refJobName,
          company: refJobCompany,
          title: refJobTitle,
          relationship: refJobRelationship,
          phone: refJobPhone,
          email: refJobEmail,
        },
        justiceOfThePeace: {
          name: refJpName,
          contact: refJpContact,
          jurisdiction: refJpJurisdiction,
          relationship: refJpRelationship,
        },
        pastor: {
          name: refPastorName,
          church: refPastorChurch,
          contact: refPastorContact,
          relationship: refPastorRelationship,
        },
        relative: {
          name: refRelativeName,
          contact: refRelativeContact,
          relationship: refRelativeRelationship,
        },
      },
      jobSeeker: application.jobSeeker
        ? {
          ...application.jobSeeker,
          idCardFront: Boolean(application.jobSeeker.idCardFront),
          idCardBack: Boolean(application.jobSeeker.idCardBack),
          selfieImage: Boolean(application.jobSeeker.selfieImage),
        }
        : application.jobSeeker,
    };
  }

  private async notifyMatchingJobSeekers(
    jobId: string,
    categoryIds: string[],
    job: any,
    creatorUserId: string,
  ) {
    try {
      if (!categoryIds?.length) return;

      // matching jobseekers খোঁজো — preferredJobCategories দিয়ে
      const matchingJobSeekers = await this.prisma.jobSeekerProfile.findMany({
        where: {
          preferredJobCategories: {
            some: {
              id: { in: categoryIds },
            },
          },
          user: {
            status: 'ACTIVE',
          },
        },
        select: {
          id: true,
          userId: true,
          fullName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!matchingJobSeekers.length) return;

      const salaryText = job.salaryAmount
        ? `${job.salaryAmount}${job.salaryFrequency ? ' / ' + job.salaryFrequency : ''}`
        : 'Not specified';

      for (const seeker of matchingJobSeekers) {
        if (!seeker.user?.email) continue;

        const notificationTitle = 'New job match';
        const notificationMessage = `${job.title} matches your selected categories.`;
        const notificationType = `JOB_MATCH:${jobId}`;
        const jobLink = `https://hirehubja.com/jobseeker/jobs/${jobId}`;

        await this.prisma.notification.create({
          data: {
            userId: seeker.userId,
            createdBy: creatorUserId,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
          },
        });

        await this.notificationService.sendNotificationToUser(
          seeker.userId,
          notificationTitle,
          notificationMessage,
          {
            type: notificationType,
            jobId,
            route: `/jobseeker/jobs/${jobId}`,
          },
        );

        await this.mailService.sendJobMatchMail(
          seeker.user.email,
          seeker.fullName ?? 'there',
          job.title,
          job.isAnonymous ? 'Anonymous' : (job.employer?.companyName ?? job.employer?.fullName ?? 'Company'),
          job.location ?? 'Not specified',
          jobLink,
        );
      }
    } catch (error) {

      console.error('Failed to notify matching jobseekers:', error);
    }
  }
}
