import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyJobDto, ReportJobDto } from './dto/job-action.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto, ChangePasswordDto } from './dto/profile.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Prisma } from '../generated/prisma/client';
import { abort } from 'node:process';
import { MailService } from 'src/admin/admin-mail/mail.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JobSeekerService {
  private readonly ANONYMOUS_IMAGE = '/uploads/anonymous.png';
  constructor(
    private prisma: PrismaService,
    private notificationService: FirebaseService,
    private mailService: MailService,
  ) { }


  // ==================================================
  // GET LATEST 6 PUBLIC JOBS
  // ==================================================
  async getLatestPublicJobs() {
    const jobs = await this.prisma.job.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employer: {
          select: {
            fullName: true,
            companyName: true,
            profilePic: true,
          },
        },
      },
    });

    return {
      data: jobs.map(job => ({
        ...job,
        employer: job.isAnonymous
          ? { fullName: 'Anonymous', companyName: 'Anonymous', profilePic: '/uploads/anonymous.png' }
          : job.employer,
      })),
      meta: {
        total: jobs.length,
        limit: 5,
      },
    };
  }

  // ==================================================
  // 1. HOME & SEARCH (With Advanced Filters)
  // ==================================================
  async getAllJobs(query: any, userId?: string) {
    const {
      search,
      location,
      categoryId,
      workplaceType,
      employmentType,
      recommended: recommendedFilter,
      others: othersFilter,
      minSalary,
      maxSalary,
      page = 1,
      limit = 15,
    } = query;

    const pagination = this.getPagination(page, limit);
    const jobTypesToSearch = this.buildJobTypesToSearch(workplaceType, employmentType);

    const whereClause = this.buildJobsWhereClause({
      search,
      location,
      categoryId,
      jobTypesToSearch,
    });

    // If categoryId is provided, skip recommended/others split and return filtered data only
    if (categoryId) {
      return this.findJobsWithPagination(whereClause, pagination, minSalary, maxSalary);
    }

    if (!userId) {
      return this.findJobsWithPagination(whereClause, pagination, minSalary, maxSalary);
    }

    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        preferredJobCategories: {
          select: { id: true },
        },
      },
    });

    const recommendedOnly = recommendedFilter !== undefined && recommendedFilter !== 'false';
    const othersOnly = othersFilter !== undefined && othersFilter !== 'false';

    const categoryIds = profile?.preferredJobCategories.map((category) => category.id) ?? [];

    if (categoryIds.length === 0) {
      const otherJobs = await this.findJobsWithPagination(
        whereClause,
        pagination,
        minSalary,
        maxSalary,
      );

      if (recommendedOnly && !othersOnly) {
        return {
          data: [],
          meta: {
            total: 0,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: 0,
            hasNextPage: false,
          },
        };
      }

      if (othersOnly && !recommendedOnly) {
        return {
          data: otherJobs.data,
          meta: otherJobs.meta,
        };
      }

      return {
        data: {
          recommended: [],
          other: otherJobs.data,
          meta: {
            recommended: {
              total: 0,
              page: pagination.page,
              limit: pagination.limit,
              totalPages: 0,
              hasNextPage: false,
            },
            other: otherJobs.meta,
          },
        },
      };
    }

    const recommendedWhereClause = this.mergeWhereClause(whereClause, {
      categories: { some: { id: { in: categoryIds } } },
    });

    const otherWhereClause = this.mergeWhereClause(whereClause, {
      NOT: { categories: { some: { id: { in: categoryIds } } } },
    });

    const [recommended, other] = await Promise.all([
      this.findJobsWithPagination(recommendedWhereClause, pagination, minSalary, maxSalary),
      this.findJobsWithPagination(otherWhereClause, pagination, minSalary, maxSalary),
    ]);

    if (recommendedOnly && !othersOnly) {
      return {
        data: recommended.data,
        meta: recommended.meta,
      };
    }

    if (othersOnly && !recommendedOnly) {
      return {
        data: other.data,
        meta: other.meta,
      };
    }

    return {
      data: {
        recommended: recommended.data,
        other: other.data,
        meta: {
          recommended: recommended.meta,
          other: other.meta,
        },
      },
    };
  }

  private mergeWhereClause(
    baseWhereClause: Prisma.JobWhereInput,
    extraWhereClause: Prisma.JobWhereInput,
  ): Prisma.JobWhereInput {
    return {
      AND: [baseWhereClause, extraWhereClause],
    };
  }

  // ==================================================
  // 1b. JOBS MATCHED WITH USER PREFERRED CATEGORIES
  // ==================================================
  async getCategoryMatchedJobs(userId: string, query: any) {
    const {
      search,
      location,
      workplaceType,
      employmentType,
      minSalary,
      maxSalary,
      page = 1,
      limit = 15,
    } = query;

    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        preferredJobCategories: {
          select: { id: true },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const categoryIds = profile.preferredJobCategories.map((category) => category.id);
    const pagination = this.getPagination(page, limit);

    if (categoryIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
          hasNextPage: false,
        },
      };
    }

    const jobTypesToSearch = this.buildJobTypesToSearch(workplaceType, employmentType);

    const whereClause = this.buildJobsWhereClause({
      search,
      location,
      categoryIds,
      jobTypesToSearch,
    });

    return this.findJobsWithPagination(whereClause, pagination, minSalary, maxSalary);
  }
  // ==================================================
  // 2. JOB DETAILS
  // ==================================================
  private resolveUserIdFromHeaders(headers?: Record<string, any>) {
    try {
      const authHeader = headers?.authorization || headers?.Authorization;
      const cookieHeader = headers?.cookie;

      let token: string | null = null;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (typeof cookieHeader === 'string') {
        const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }

      if (!token) return null;

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretKey') as { sub?: string };

      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }

  async getJobDetails(jobId: string, userId?: string | null, headers?: Record<string, any>) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          include: { user: { select: { role: true } } },
        },
        categories: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found');

    // If user is not authenticated, skip looking up profile-specific fields
    let profileId: string | null = null;
    const resolvedUserId = userId ?? this.resolveUserIdFromHeaders(headers);
    if (resolvedUserId) {
      profileId = await this.getProfileId(resolvedUserId);
    }

    let hasApplied: any = null;
    let isBookmarked: any = null;

    if (profileId) {
      hasApplied = await this.prisma.application.findUnique({
        where: {
          jobId_jobSeekerId: { jobId, jobSeekerId: profileId },
        },
      });

      isBookmarked = await this.prisma.savedJob.findUnique({
        where: {
          jobId_jobSeekerId: { jobId, jobSeekerId: profileId },
        },
      });
    }

    // fetch authenticated user's role (if any) and include in response
    let userRole: string | null = null;
    if (resolvedUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: resolvedUserId },
        select: { role: true },
      });
      userRole = user?.role ?? null;
    }

    return {
      ...job,
      employer: (() => {
        if (job.isAnonymous) {
          return {
            ...job.employer,
            fullName: 'Anonymous',
            companyName: 'Anonymous',
            profilePic: '/uploads/anonymous.png',
            role: 'EMPLOYER',
          };
        }
        const { user, ...employerFields } = job.employer as any;
        return {
          ...employerFields,
          role: job.employer?.user?.role ?? 'EMPLOYER',
        };
      })(),
      hasApplied: !!hasApplied,
      isBookmarked: !!isBookmarked,
    };
  }

  // ==================================================
  // 3. APPLY JOB
  // ==================================================
  async applyJob(userId: string, dto: ApplyJobDto, resumeUrl: string | null) {
    const profileId = await this.getProfileId(userId);

    if (!resumeUrl) {
      throw new BadRequestException('Resume is required. Please upload your resume to continue.');
    }

    if (!dto.availableFrom?.trim()) {
      throw new BadRequestException('Availability / Start Date is required.');
    }

    if (!dto.shortMessage?.trim()) {
      throw new BadRequestException('Short Message is required.');
    }

    const existingApp = await this.prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: { jobId: dto.jobId, jobSeekerId: profileId },
      },
    });

    if (existingApp) throw new BadRequestException('You have already applied to this job!');

    const application = await this.prisma.application.create({
      data: {
        jobId: dto.jobId,
        jobSeekerId: profileId,
        status: 'APPLIED',
        resumeUrl: resumeUrl,
        availableFrom: new Date(dto.availableFrom),
        shortMessage: dto.shortMessage.trim(),

        // --- References ---
        refJobName: dto.refJobName,
        refJobCompany: dto.refJobCompany,
        refJobTitle: dto.refJobTitle,
        refJobRelationship: dto.refJobRelationship,
        refJobPhone: dto.refJobPhone,
        refJobEmail: dto.refJobEmail,

        refJpName: dto.refJpName,
        refJpContact: dto.refJpContact,
        refJpJurisdiction: dto.refJpJurisdiction,
        refJpRelationship: dto.refJpRelationship,

        refPastorName: dto.refPastorName,
        refPastorChurch: dto.refPastorChurch,
        refPastorContact: dto.refPastorContact,
        refPastorRelationship: dto.refPastorRelationship,

        refRelativeName: dto.refRelativeName,
        refRelativeContact: dto.refRelativeContact,
        refRelativeRelationship: dto.refRelativeRelationship,
      },
    });

    // send notification for employer
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { employer: true },
    });

    if (job) {
      await this.notificationService.createNotification(
        job.employer.userId,
        'New Application Received',
        `Someone applied for your job: ${job.title}`,
        'APPLICATION',
        userId,
      );

      const employerUser = await this.prisma.user.findUnique({
        where: { id: job.employer.userId },
        select: { email: true },
      });

      if (employerUser?.email) {
        const seekerProfile = await this.prisma.jobSeekerProfile.findUnique({
          where: { userId },
          select: { fullName: true },
        });

        await this.mailService.sendApplicationNotificationMail(
          employerUser.email,
          job.employer?.companyName ?? 'Employer',
          seekerProfile?.fullName ?? 'A candidate',
          job.title,
          `https://hirehubja.com/applications/${application.id}`,
        );
      }
    }

    return application;
  }
  // ==================================================
  // 4. BOOKMARK / SAVE JOB (Toggle)
  // ==================================================
  async toggleBookmark(userId: string, jobId: string) {
    const profileId = await this.getProfileId(userId);

    const existing = await this.prisma.savedJob.findUnique({
      where: {
        jobId_jobSeekerId: { jobId, jobSeekerId: profileId },
      },
    });

    if (existing) {
      await this.prisma.savedJob.delete({ where: { id: existing.id } });
      return { message: 'Job removed from bookmarks', isBookmarked: false };
    } else {
      await this.prisma.savedJob.create({
        data: { jobId, jobSeekerId: profileId },
      });
      return { message: 'Job bookmarked successfully', isBookmarked: true };
    }
  }

  // ==================================================
  // 4b. GET BOOKMARKED JOBS (With Pagination)
  // ==================================================
  async getBookmarkedJobs(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const profileId = await this.getProfileId(userId);

    const page = Number.isFinite(params?.page) && (params?.page ?? 0) > 0
      ? Math.floor(params!.page!)
      : 1;
    const limit = Number.isFinite(params?.limit) && (params?.limit ?? 0) > 0
      ? Math.floor(params!.limit!)
      : 10;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.savedJob.count({
        where: { jobSeekerId: profileId },
      }),
      this.prisma.savedJob.findMany({
        where: { jobSeekerId: profileId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          job: {
            include: { employer: true, categories: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((saved) => ({
        ...saved,
        job: {
          ...saved.job,
          employer: saved.job.isAnonymous
            ? { fullName: 'Anonymous', profilePic: '/uploads/anonymous.png', about: null, }
            : saved.job.employer,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page * limit < total,
      },
    };
  }


  // ==================================================
  // 5. TRACK APPLICATIONS
  // ==================================================
  async getMyApplications(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const profileId = await this.getProfileId(userId);

    const page = Number.isFinite(params?.page) && (params?.page ?? 0) > 0
      ? Math.floor(params!.page!)
      : 1;
    const limit = Number.isFinite(params?.limit) && (params?.limit ?? 0) > 0
      ? Math.floor(params!.limit!)
      : 10;
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where: { jobSeekerId: profileId } }),
      this.prisma.application.findMany({
        where: { jobSeekerId: profileId },
        include: {
          job: {
            include: { employer: true },
          },
          interview: {
            include: {
              payment: {
                select: {
                  id: true,
                  status: true,
                  candidateCompletedAt: true,
                  employerCompletedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ==================================================
  // 6. REPORT JOB
  // ==================================================
  async reportJob(userId: string, dto: ReportJobDto) {
    return this.prisma.report.create({
      data: {
        reporterId: userId,
        jobId: dto.jobId,
        reason: dto.reason,
        details: dto.details,
        status: 'PENDING',
      },
    });
  }




  // ==================================================
  // DELETE APPLICATION
  // ==================================================
  async deleteApplication(userId: string, applicationId: string) {
    const profileId = await this.getProfileId(userId);

    // Check if application exists and belongs to this user
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.jobSeekerId !== profileId) {
      throw new BadRequestException('You can only delete your own applications');
    }

    // Delete the application
    await this.prisma.application.delete({
      where: { id: applicationId },
    });

    return { message: 'Application deleted successfully' };
  }

  // ==================================================
  // HELPER
  // ==================================================
  private getPagination(pageInput: any, limitInput: any) {
    const parsedPage = Number(pageInput);
    const parsedLimit = Number(limitInput);

    const page = Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.floor(parsedPage)
      : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 100)
      : 15;

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  private buildJobTypesToSearch(workplaceType?: string, employmentType?: string): string[] {
    const jobTypesToSearch: string[] = [];

    if (workplaceType) {
      jobTypesToSearch.push(workplaceType.toUpperCase().replace('-', '_'));
    }
    if (employmentType) {
      jobTypesToSearch.push(employmentType.toUpperCase().replace('-', '_'));
    }

    return jobTypesToSearch;
  }

  private buildJobsWhereClause(params: {
    search?: string;
    location?: string;
    categoryId?: string;
    categoryIds?: string[];
    jobTypesToSearch: string[];
  }): Prisma.JobWhereInput {
    const andConditions: Prisma.JobWhereInput[] = [];

    if (params.search) {
      andConditions.push({
        title: { contains: params.search, mode: Prisma.QueryMode.insensitive },
      });
    }

    if (params.location) {
      andConditions.push({
        location: { contains: params.location, mode: Prisma.QueryMode.insensitive },
      });
    }

    if (params.categoryId) {
      andConditions.push({ categories: { some: { id: params.categoryId } } });
    }

    if (params.categoryIds && params.categoryIds.length > 0) {
      andConditions.push({ categories: { some: { id: { in: params.categoryIds } } } });
    }

    if (params.jobTypesToSearch.length > 0) {
      andConditions.push({ jobType: { hasEvery: params.jobTypesToSearch as any } });
    }

    const whereClause: Prisma.JobWhereInput = {
      status: 'OPEN',
    };

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    return whereClause;
  }

  private hasSalaryFilter(minSalary?: any, maxSalary?: any) {
    return (minSalary !== undefined && minSalary !== null && minSalary !== '')
      || (maxSalary !== undefined && maxSalary !== null && maxSalary !== '');
  }

  private applySalaryFilter<T extends { salaryAmount: string | null }>(
    jobs: T[],
    minSalary?: any,
    maxSalary?: any,
  ) {
    if (!this.hasSalaryFilter(minSalary, maxSalary)) {
      return jobs;
    }

    const filterMin = minSalary ? Number(minSalary) : 0;
    const filterMax = maxSalary ? Number(maxSalary) : Infinity;

    return jobs.filter((job) => {
      if (!job.salaryAmount) return false;

      const extractedNumbers = job.salaryAmount.match(/\d+/g);
      if (!extractedNumbers) return false;

      const jobMinSalary = Number(extractedNumbers[0]);
      const jobMaxSalary = extractedNumbers.length > 1
        ? Number(extractedNumbers[1])
        : jobMinSalary;

      return jobMaxSalary >= filterMin && jobMinSalary <= filterMax;
    });
  }

  private async findJobsWithPagination(
    whereClause: Prisma.JobWhereInput,
    pagination: { page: number; limit: number; skip: number; take: number },
    minSalary?: any,
    maxSalary?: any,
  ) {
    const baseQuery = {
      where: whereClause,
      include: {
        employer: { select: { fullName: true, profilePic: true, about: true } },
        categories: { select: { id: true, name: true, image: true, description: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    };

    let jobs: any[];
    let total: number;

    if (this.hasSalaryFilter(minSalary, maxSalary)) {
      const allJobs = await this.prisma.job.findMany(baseQuery);
      const filteredJobs = this.applySalaryFilter(allJobs, minSalary, maxSalary);

      total = filteredJobs.length;
      jobs = filteredJobs.slice(pagination.skip, pagination.skip + pagination.take);
    } else {
      const [pagedJobs, count] = await Promise.all([
        this.prisma.job.findMany({
          ...baseQuery,
          skip: pagination.skip,
          take: pagination.take,
        }),
        this.prisma.job.count({ where: whereClause }),
      ]);

      jobs = pagedJobs;
      total = count;
    }

    return {
      data: jobs.map((job) => ({
        ...job,
        employer: job.isAnonymous
          ? { fullName: 'Anonymous', profilePic: '/uploads/anonymous.png', about: null }
          : job.employer,
      })),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page * pagination.limit < total,
      },
    };
  }

  private async getProfileId(userId?: string): Promise<string> {
    // Defensive: if no userId provided, return null to avoid calling Prisma with undefined
    if (!userId) return null as any;

    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Job Seeker Profile not found');
    return profile.id;
  }



  async getInterviewDetails(userId: string, interviewId: string) {
    const profileId = await this.getProfileId(userId);

    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          jobSeekerId: profileId,
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
  // GET PROFILE
  // ==================================================
  async getProfile(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        education: true,
        experience: true,
        preferredJobCategories: true,
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  // ==================================================
  // UPDATE PROFILE
  // ==================================================
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    profilePic?: string | null,
    resumeUrl?: string | null,
  ) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const skills = typeof dto.skills === 'string'
      ? JSON.parse(dto.skills)
      : dto.skills ?? undefined;

    const education = typeof dto.education === 'string'
      ? JSON.parse(dto.education)
      : dto.education;

    const experience = typeof dto.experience === 'string'
      ? JSON.parse(dto.experience)
      : dto.experience;

    if (education) {
      await this.prisma.education.deleteMany({
        where: { jobSeekerId: profile.id },
      });
    }

    if (experience) {
      await this.prisma.experience.deleteMany({
        where: { jobSeekerId: profile.id },
      });
    }

    return this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        experienceLevel: dto.experienceLevel,
        skills: skills,
        profilePic: profilePic ?? undefined,
        resumeUrl: resumeUrl ?? undefined,

        education: education ? {
          create: education.map((edu) => ({
            degreeName: edu.degreeName,
            institution: edu.institution,
            startDate: new Date(edu.startDate),
            completionYear: edu.completionYear
              ? new Date(edu.completionYear)
              : null,
            isCurrent: edu.isCurrent ?? false,
          })),
        } : undefined,

        experience: experience ? {
          create: experience.map((exp) => ({
            designation: exp.designation,
            companyName: exp.companyName,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent ?? false,
            description: exp.description,
          })),
        } : undefined,
      },
      include: {
        education: true,
        experience: true,
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
  // DELETE ACCOUNT
  // ==================================================
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }
}
