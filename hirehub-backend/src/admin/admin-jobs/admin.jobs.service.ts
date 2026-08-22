import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminJobsQueryDto } from './dto/jobs-query.dto';
import { JobStatus, Prisma } from '../../generated/prisma/client';
import { ApplicationsQueryDto } from './dto/applications-query.dto';
import { ApplicationStatus } from '../../generated/prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(private readonly prisma: PrismaService) { }

  async getJobs(query: AdminJobsQueryDto) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {};

    if (query?.status) {
      where.status = query.status as JobStatus;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { employer: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, jobs] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          location: true,
          jobType: true,
          status: true,
          isRemote: true,
          deadline: true,
          createdAt: true,
          categories: { select: { id: true, name: true } },
          employer: {
            select: {
              companyName: true,
              fullName: true,
              profilePic: true,
              user: { select: { email: true } },
            },
          },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    // Safe Mapping
    const formatted = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      jobType: j.jobType,
      status: j.status,
      isRemote: j.isRemote,
      deadline: j.deadline,
      createdAt: j.createdAt,
      categories: j.categories || [],
      companyName: j.employer?.companyName || 'N/A',
      employerName: j.employer?.fullName || 'N/A',
      employerEmail: j.employer?.user?.email || 'N/A',
      companyLogo: j.employer?.profilePic || null,
      totalApplications: j._count?.applications || 0,
    }));

    return {
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
    };
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        categories: true,
        employer: {
          select: {
            companyName: true,
            fullName: true,
            profilePic: true,
            location: true,
            about: true,
            user: { select: { email: true } },
          },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return { success: true, data: job };
  }


  async getJobApplications(id: string, query: ApplicationsQueryDto) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = { jobId: id };

    if (query?.status) {
      where.status = query.status as ApplicationStatus;
    }

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          shortMessage: true,
          resumeUrl: true,
          availableFrom: true,
          jobSeeker: {
            select: {
              fullName: true,
              profilePic: true,
              resumeUrl: true,
              location: true,
              experienceLevel: true,
              skills: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
    ]);

    const formatted = applications.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      shortMessage: a.shortMessage ?? null,
      resumeUrl: a.resumeUrl ?? a.jobSeeker?.resumeUrl ?? null,
      availableFrom: a.availableFrom ?? null,
      applicantName: a.jobSeeker?.fullName || 'N/A',
      applicantEmail: a.jobSeeker?.user?.email || 'N/A',
      applicantPhoto: a.jobSeeker?.profilePic || null,
      location: a.jobSeeker?.location || null,
      experienceLevel: a.jobSeeker?.experienceLevel || null,
      skills: a.jobSeeker?.skills ?? [],
    }));

    return {
      success: true,
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async blockJob(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status === JobStatus.BLOCKED_BY_ADMIN) {
      return { success: true, message: 'Job is already blocked' };
    }

    await this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.BLOCKED_BY_ADMIN },
    });

    return { success: true, message: 'Job blocked successfully' };
  }

  async unblockJob(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    await this.prisma.job.update({
      where: { id },
      data: { status: 'OPEN' },
    });

    return { success: true, message: 'Job unblocked successfully' };
  }


  async deleteJob(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    // related data  delete 
    const applications = await this.prisma.application.findMany({
      where: { jobId: id },
      select: { id: true },
    });

    const applicationIds = applications.map((a) => a.id);

    // interview  payment  delete
    await this.prisma.payment.deleteMany({
      where: { interview: { applicationId: { in: applicationIds } } },
    });

    // interview delete
    await this.prisma.interview.deleteMany({
      where: { applicationId: { in: applicationIds } },
    });

    // applications delete
    await this.prisma.application.deleteMany({ where: { jobId: id } });

    // saved jobs delete
    await this.prisma.savedJob.deleteMany({ where: { jobId: id } });

    // reports delete
    await this.prisma.report.deleteMany({ where: { jobId: id } });

    // finally job delete
    await this.prisma.job.delete({ where: { id } });

    return { success: true, message: 'Job deleted successfully' };
  }
}