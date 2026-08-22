import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus, JobStatus, PaymentStatus } from '../../generated/prisma/client';
import { subDays, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachMonthOfInterval, format } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  private getJobSeekerCompletionFilter() {
    return {
      jobSeekerProfile: {
        is: {
          profilePic: { not: null },
          phone: { not: null },
          about: { not: null },
          location: { not: null },
          gender: { not: null },
          employmentType: { isEmpty: false },
          resumeUrl: { not: null },
          experienceLevel: { not: null },
          skills: { isEmpty: false },
          preferredJobCategories: { some: {} },
          education: { some: {} },
        },
      },
    };
  }

  private getEmployerCompletionFilter() {
    return {
      employerProfile: {
        is: {
          profilePic: { not: null },
          phone: { not: null },
          about: { not: null },
          location: { not: null },
        },
      },
    };
  }

  private getCompanyCompletionFilter() {
    return {
      employerProfile: {
        is: {
          profilePic: { not: null },
          phone: { not: null },
          about: { not: null },
          location: { not: null },
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. STATS
  // ─────────────────────────────────────────────────────────────
  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [totalJobSeekers, totalEmployers, totalCompanies, activeJobPosts] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.JOB_SEEKER } }),
      this.prisma.user.count({ where: { role: UserRole.EMPLOYER } }),
      this.prisma.user.count({ where: { role: UserRole.COMPANY } }),
      this.prisma.job.count({ where: { status: JobStatus.OPEN } }),
    ]);

    const [prevJobSeekers, prevEmployers, prevCompanies, prevActiveJobs] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.JOB_SEEKER, createdAt: { lt: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: UserRole.EMPLOYER, createdAt: { lt: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: UserRole.COMPANY, createdAt: { lt: thirtyDaysAgo } } }),
      this.prisma.job.count({ where: { status: JobStatus.OPEN, createdAt: { lt: thirtyDaysAgo } } }),
    ]);

    const calcGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    return {
      success: true,
      data: {
        totalJobSeekers: {
          count: totalJobSeekers,
          growthPercent: calcGrowth(totalJobSeekers, prevJobSeekers),
          label: 'Total Job Seekers',
        },
        totalEmployers: {
          count: totalEmployers,
          growthPercent: calcGrowth(totalEmployers, prevEmployers),
          label: 'Total Employers',
        },
        totalCompanies: {
          count: totalCompanies,
          growthPercent: calcGrowth(totalCompanies, prevCompanies),
          label: 'Total Companies',
        },
        activeJobPosts: {
          count: activeJobPosts,
          growthPercent: calcGrowth(activeJobPosts, prevActiveJobs),
          label: 'Active Job Posts',
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PIE CHART
  // ─────────────────────────────────────────────────────────────
  async getPieChart() {
    const [totalJobSeekers, totalEmployers, totalCompanies, activeJobSeekers, activeEmployers, activeCompanies] =
      await Promise.all([
        this.prisma.user.count({ where: { role: UserRole.JOB_SEEKER } }),
        this.prisma.user.count({ where: { role: UserRole.EMPLOYER } }),
        this.prisma.user.count({ where: { role: UserRole.COMPANY } }),
        this.prisma.user.count({ where: { role: UserRole.JOB_SEEKER, status: UserStatus.ACTIVE } }),
        this.prisma.user.count({ where: { role: UserRole.EMPLOYER, status: UserStatus.ACTIVE } }),
        this.prisma.user.count({ where: { role: UserRole.COMPANY, status: UserStatus.ACTIVE } }),
      ]);

    const calcPercent = (active: number, total: number) =>
      total === 0 ? 0 : Math.round((active / total) * 100);

    return {
      success: true,
      data: {
        jobSeeker: {
          label: 'Job Seeker',
          total: totalJobSeekers,
          active: activeJobSeekers,
          percentage: calcPercent(activeJobSeekers, totalJobSeekers),
        },
        employer: {
          label: 'Employer',
          total: totalEmployers,
          active: activeEmployers,
          percentage: calcPercent(activeEmployers, totalEmployers),
        },
        company: {
          label: 'Companies',
          total: totalCompanies,
          active: activeCompanies,
          percentage: calcPercent(activeCompanies, totalCompanies),
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. EARNINGS
  // ─────────────────────────────────────────────────────────────
  async getEarnings(period: 'weekly' | 'monthly' | 'yearly' = 'weekly') {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    if (period === 'weekly') {
      startDate = startOfWeek(now, { weekStartsOn: 0 });
      groupFormat = 'EEE';
    } else if (period === 'monthly') {
      startDate = startOfMonth(now);
      groupFormat = 'dd';
    } else {
      startDate = startOfYear(now);
      groupFormat = 'MMM';
    }

    // ✅ Payment ও SubscriptionPayment একসাথে fetch
    const [payments, subscriptionPayments] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate, lte: now },
        },
        select: { platformFee: true, paidAt: true },
      }),
      this.prisma.subscriptionPayment.findMany({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate, lte: now },
        },
        select: { amount: true, paidAt: true },
      }),
    ]);

    let labels: string[] = [];
    let dataMap: Record<string, number> = {};

    if (period === 'weekly' || period === 'monthly') {
      const days = eachDayOfInterval({ start: startDate, end: now });
      labels = days.map((d) => format(d, groupFormat));
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: now });
      labels = months.map((m) => format(m, groupFormat));
    }

    labels.forEach((l) => (dataMap[l] = 0));

    // ✅ Payment (platformFee) যোগ
    payments.forEach((p) => {
      if (p.paidAt) {
        const key = format(p.paidAt, groupFormat);
        dataMap[key] = (dataMap[key] || 0) + Number(p.platformFee);
      }
    });

    // ✅ SubscriptionPayment (amount) যোগ
    subscriptionPayments.forEach((p) => {
      if (p.paidAt) {
        const key = format(p.paidAt, groupFormat);
        dataMap[key] = (dataMap[key] || 0) + Number(p.amount);
      }
    });

    const totalFromPayments = payments.reduce((sum, p) => sum + Number(p.platformFee), 0);
    const totalFromSubscriptions = subscriptionPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalEarnings = totalFromPayments + totalFromSubscriptions;

    return {
      success: true,
      data: {
        period,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalFromPayments: Math.round(totalFromPayments * 100) / 100,       // ✅ আলাদা breakdown
        totalFromSubscriptions: Math.round(totalFromSubscriptions * 100) / 100, // ✅ আলাদা breakdown
        currency: 'JMD',
        chart: labels.map((label) => ({
          label,
          amount: Math.round((dataMap[label] || 0) * 100) / 100,
        })),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. APPROVAL REQUESTS (With Pagination)
  // ─────────────────────────────────────────────────────────────
  async getApprovalRequests(
    type?: string,
    limit: number = 10,
    page: number = 1
  ) {
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const roleMap: Record<string, UserRole> = {
      JOB_SEEKER: UserRole.JOB_SEEKER,
      EMPLOYER: UserRole.EMPLOYER,
      COMPANY: UserRole.COMPANY,
    };

    // Build the query. If 'type' is missing or 'ALL', it fetches all pending users.
    const whereClause: any = {
      status: UserStatus.PENDING,
    };

    if (type && roleMap[type]) {
      whereClause.role = roleMap[type];
      if (roleMap[type] === UserRole.JOB_SEEKER) {
        Object.assign(whereClause, this.getJobSeekerCompletionFilter());
      } else if (roleMap[type] === UserRole.EMPLOYER) {
        Object.assign(whereClause, this.getEmployerCompletionFilter());
      } else if (roleMap[type] === UserRole.COMPANY) {
        Object.assign(whereClause, this.getCompanyCompletionFilter());
      }
    } else {
      whereClause.OR = [
        { role: UserRole.JOB_SEEKER, ...this.getJobSeekerCompletionFilter() },
        { role: UserRole.EMPLOYER, ...this.getEmployerCompletionFilter() },
        { role: UserRole.COMPANY, ...this.getCompanyCompletionFilter() },
      ];
    }

    // Run count and findMany in parallel for better performance
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        take: limitNum,
        skip: skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          jobSeekerProfile: {
            select: {
              fullName: true,
              profilePic: true,
              idCardFront: true,
              idCardBack: true,
              selfieImage: true,
              resumeUrl: true,
              preferredJobCategories: { select: { name: true } },
            },
          },
          employerProfile: {
            select: {
              fullName: true,
              companyName: true,
              profilePic: true,
              idCardFront: true,
              idCardBack: true,
              licenseFile: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereClause })
    ]);

    const formatted = users.map((u) => {
      const profile = u.jobSeekerProfile || u.employerProfile;
      const categories = (u.jobSeekerProfile as any)?.preferredJobCategories?.map(
        (c: { name: string }) => c.name
      ) ?? [];

      return {
        userId: u.id,
        fullName: profile?.fullName ?? (u.employerProfile as any)?.companyName ?? 'N/A',
        email: u.email,
        registrationDate: u.createdAt,
        category: categories.length > 0 ? categories.join(', ') : null,
        verificationStatus: u.status,
        profilePic: profile?.profilePic ?? null,
        hasDocuments: !!(
          (u.jobSeekerProfile?.idCardFront || u.employerProfile?.idCardFront) &&
          (u.jobSeekerProfile?.selfieImage || u.employerProfile?.idCardBack)
        ),
      };
    });

    return {
      success: true,
      data: formatted,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

}
