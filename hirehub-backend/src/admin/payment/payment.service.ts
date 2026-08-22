// src/admin/payment/payment.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma/client';

@Injectable()
export class AdminPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayments(
    search?: string,
    status?: PaymentStatus,
    type?: 'JOB_PAYMENT' | 'SUBSCRIPTION', // 👈 add
    page: number = 1,
    limit: number = 10,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // type অনুযায়ী কোনটা fetch করবে
    const fetchJobs = !type || type === 'JOB_PAYMENT';
    const fetchSubs = !type || type === 'SUBSCRIPTION';

    const statusFilter = status ? { status } : {};

    const jobSearchFilter = search
      ? {
          OR: [
            { candidate: { fullName: { contains: search, mode: 'insensitive' as const } } },
            { candidate: { user: { email: { contains: search, mode: 'insensitive' as const } } } },
            { employer: { fullName: { contains: search, mode: 'insensitive' as const } } },
            { employer: { companyName: { contains: search, mode: 'insensitive' as const } } },
            { employer: { user: { email: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {};

    const subSearchFilter = search
      ? {
          OR: [
            { employer: { fullName: { contains: search, mode: 'insensitive' as const } } },
            { employer: { companyName: { contains: search, mode: 'insensitive' as const } } },
            { employer: { user: { email: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {};

    const jobWhere = { ...jobSearchFilter, ...statusFilter };
    const subWhere = { ...subSearchFilter, ...statusFilter };

    const [jobPayments, subscriptionPayments, jobTotal, subTotal] = await Promise.all([
      // Job payments — type filter না থাকলে বা JOB_PAYMENT হলে fetch করবে
      fetchJobs
        ? this.prisma.payment.findMany({
            where: jobWhere,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderId: true,
              amount: true,
              platformFee: true,
              totalAmount: true,
              currency: true,
              status: true,
              paidAt: true,
              createdAt: true,
              employer: {
                select: {
                  id: true,
                  fullName: true,
                  companyName: true,
                  profilePic: true,
                  user: { select: { email: true, createdAt: true, status: true } },
                },
              },
              candidate: {
                select: {
                  id: true,
                  fullName: true,
                  profilePic: true,
                  user: { select: { email: true, createdAt: true, status: true } },
                  education: {
                    select: {
                      degreeName: true,
                      institution: true,
                      completionYear: true,
                      isCurrent: true,
                    },
                    orderBy: { startDate: 'desc' },
                    take: 3,
                  },
                },
              },
              interview: {
                select: {
                  interviewType: true,
                  scheduleDate: true,
                  status: true,
                  application: {
                    select: {
                      job: { select: { title: true, location: true } },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),

      // Subscription payments — type filter না থাকলে বা SUBSCRIPTION হলে fetch করবে
      fetchSubs
        ? this.prisma.subscriptionPayment.findMany({
            where: subWhere,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderId: true,
              amount: true,
              currency: true,
              status: true,
              paidAt: true,
              createdAt: true,
              employer: {
                select: {
                  id: true,
                  fullName: true,
                  companyName: true,
                  profilePic: true,
                  user: { select: { email: true, createdAt: true, status: true } },
                },
              },
              plan: {
                select: {
                  name: true,
                  price: true,
                  duration: true,
                  slotsAvailable: true,
                  features: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      fetchJobs
        ? this.prisma.payment.count({ where: jobWhere })
        : Promise.resolve(0),

      fetchSubs
        ? this.prisma.subscriptionPayment.count({ where: subWhere })
        : Promise.resolve(0),
    ]);

    const normalizedJobPayments = (jobPayments as any[]).map((p) => ({
      id: p.id,
      orderId: p.orderId,
      type: 'JOB_PAYMENT' as const,
      status: p.status,
      amount: Number(p.amount),
      platformFee: Number(p.platformFee),
      totalAmount: Number(p.totalAmount),
      currency: p.currency,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      paidBy: {
        id: p.employer.id,
        name: p.employer.companyName || p.employer.fullName,
        email: p.employer.user.email,
        profilePic: p.employer.profilePic,
        registrationDate: p.employer.user.createdAt,
        accountStatus: p.employer.user.status,
      },
      candidate: {
        id: p.candidate.id,
        name: p.candidate.fullName,
        email: p.candidate.user.email,
        profilePic: p.candidate.profilePic,
        registrationDate: p.candidate.user.createdAt,
        accountStatus: p.candidate.user.status,
        educations: p.candidate.education.map((e: any) => ({
          degree: e.degreeName,
          institution: e.institution,
          completionYear: e.completionYear,
          isCurrent: e.isCurrent,
        })),
      },
      forJob: {
        title: p.interview?.application?.job?.title ?? null,
        location: p.interview?.application?.job?.location ?? null,
        interviewType: p.interview?.interviewType ?? null,
        interviewDate: p.interview?.scheduleDate ?? null,
        interviewStatus: p.interview?.status ?? null,
      },
      subscription: null,
    }));

    const normalizedSubPayments = (subscriptionPayments as any[]).map((p) => ({
      id: p.id,
      orderId: p.orderId,
      type: 'SUBSCRIPTION' as const,
      status: p.status,
      amount: Number(p.amount),
      platformFee: null,
      totalAmount: Number(p.amount),
      currency: p.currency,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      paidBy: {
        id: p.employer.id,
        name: p.employer.companyName || p.employer.fullName,
        email: p.employer.user.email,
        profilePic: p.employer.profilePic,
        registrationDate: p.employer.user.createdAt,
        accountStatus: p.employer.user.status,
      },
      candidate: null,
      forJob: null,
      subscription: {
        planName: p.plan.name,
        price: p.plan.price,
        duration: p.plan.duration,
        slots: p.plan.slotsAvailable,
        features: p.plan.features,
      },
    }));

    // Merge + sort + paginate
    const allPayments = [...normalizedJobPayments, ...normalizedSubPayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const paginated = allPayments.slice(skip, skip + limitNum);
    const total = jobTotal + subTotal;

    return {
      success: true,
      message: 'Payments fetched successfully',
      data: paginated,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        jobPaymentsCount: jobTotal,
        subscriptionPaymentsCount: subTotal,
      },
    };
  }

  async markAsFailed(id: string, type: 'job' | 'subscription') {
    if (type === 'subscription') {
      const payment = await this.prisma.subscriptionPayment.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!payment) throw new NotFoundException('Subscription payment not found');
      if (payment.status === PaymentStatus.PAID)
        throw new BadRequestException('Cannot fail a completed subscription payment.');
      if (payment.status === PaymentStatus.FAILED)
        throw new BadRequestException('Already marked as failed.');

      const updated = await this.prisma.subscriptionPayment.update({
        where: { id },
        data: { status: PaymentStatus.FAILED },
        select: { id: true, orderId: true, status: true },
      });
      return { success: true, message: 'Subscription payment marked as failed', data: updated };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID)
      throw new BadRequestException('Cannot fail a completed payment.');
    if (payment.status === PaymentStatus.FAILED)
      throw new BadRequestException('Already marked as failed.');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
      select: { id: true, orderId: true, status: true },
    });
    return { success: true, message: 'Payment marked as failed', data: updated };
  }
}