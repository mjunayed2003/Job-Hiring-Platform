import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/subcription.dto';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from 'src/generated/prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyEmployer(userId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!employer || employer.user.role !== UserRole.COMPANY) {
      throw new NotFoundException('Company not found');
    }

    return employer;
  }

  private normalizeDate(dateValue?: string | Date | null) {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date value');
    }
    return parsed;
  }

  private resolveAmount(planPrice: number, amount?: string | number | null) {
    if (amount === undefined || amount === null || amount === '') return planPrice;
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new BadRequestException('Invalid payment amount');
    }
    return parsed;
  }

  private resolveSlots(planSlots: number, slotsOverride?: string | number | null) {
    if (slotsOverride === undefined || slotsOverride === null || slotsOverride === '') {
      return planSlots;
    }

    const parsed = Number(slotsOverride);
    if (Number.isNaN(parsed) || parsed < 1) {
      throw new BadRequestException('Invalid slot override');
    }

    return parsed;
  }

  private async createManualSubscriptionPayment(params: {
    employerId: string;
    planId: string;
    amount: number;
    currency?: string;
    transactionId?: string | null;
    paidAt?: Date;
  }) {
    const orderId = `MANUAL-${uuidv4()}`;
    const transactionId = params.transactionId
      ? `${params.transactionId}-${uuidv4().slice(0, 8)}`
      : orderId;

    await this.prisma.subscriptionPayment.create({
      data: {
        orderId,
        transactionId,
        amount: params.amount,
        currency: params.currency ?? 'JMD',
        status: 'PAID',
        employerId: params.employerId,
        planId: params.planId,
        paidAt: params.paidAt ?? new Date(),
      },
    });
  }

  private async pauseEmployerJobs(employerId: string) {
    await this.prisma.job.updateMany({
      where: {
        employerId,
        status: 'OPEN',
      },
      data: { status: 'PAUSED' },
    });
  }

  private async syncEmployerJobsToSlots(employerId: string, slotsAvailable: number) {
    const openJobs = await this.prisma.job.findMany({
      where: { employerId, status: 'OPEN' },
      orderBy: { updatedAt: 'asc' },
      select: { id: true },
    });

    if (openJobs.length > slotsAvailable) {
      const overflowIds = openJobs.slice(slotsAvailable).map((job) => job.id);
      await this.prisma.job.updateMany({
        where: { id: { in: overflowIds } },
        data: { status: 'PAUSED' },
      });
    }

    const canResume = Math.max(slotsAvailable - Math.min(openJobs.length, slotsAvailable), 0);
    if (canResume === 0) return;

    const pausedJobs = await this.prisma.job.findMany({
      where: { employerId, status: 'PAUSED' },
      orderBy: { updatedAt: 'desc' },
      take: canResume,
      select: { id: true },
    });

    if (pausedJobs.length === 0) return;

    await this.prisma.job.updateMany({
      where: { id: { in: pausedJobs.map((job) => job.id) } },
      data: { status: 'OPEN' },
    });
  }

  private buildSubscriptionResponse(subscription: any) {
    const effectiveSlotsAvailable =
      subscription.slotsOverride ?? subscription.plan?.slotsAvailable ?? null;
    return {
      id: subscription.id,
      employerId: subscription.employerId,
      planId: subscription.planId,
      planName: subscription.plan?.name ?? null,
      price: subscription.plan?.price ?? null,
      duration: subscription.plan?.duration ?? null,
      slotsAvailable: subscription.plan?.slotsAvailable ?? null,
      slotsOverride: subscription.slotsOverride ?? null,
      effectiveSlotsAvailable,
      features: subscription.plan?.features ?? [],
      startDate: subscription.startDate,
      expiryDate: subscription.expiryDate,
      isActive: subscription.isActive,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  async getPlans() {
  const plans = await this.prisma.subscriptionPlan.findMany({
    where: { isActive: true }, //  deactivated plans hide 
    orderBy: { createdAt: 'asc' },
  });
  return { success: true, data: plans };
}

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        revenueCatProductId: dto.revenueCatProductId,
        price: dto.price,
        duration: dto.duration,
        slotsAvailable: dto.slotsAvailable,
        features: dto.features,
      },
    });
    return { success: true, message: 'Plan created successfully', data: plan };
  }

  async updatePlan(id: string, dto: CreateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        revenueCatProductId: dto.revenueCatProductId,
        price: dto.price,
        duration: dto.duration,
        slotsAvailable: dto.slotsAvailable,
        features: dto.features,
      },
    });
    return { success: true, message: 'Plan updated successfully', data: updated };
  }



  async deletePlan(id: string) {
  const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new NotFoundException('Plan not found');

  const paymentsCount = await this.prisma.subscriptionPayment.count({
    where: { planId: id },
  });

  if (paymentsCount > 0) {
    // Payment  — soft delete
    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return {
      success: true,
      message: 'Plan deactivated (has existing payments)',
      data: updated,
    };
  }

  // Payment  — hard delete
  await this.prisma.subscriptionPlan.delete({ where: { id } });
  return { success: true, message: 'Plan deleted successfully' };
}

  // ─────────────────────────────────────────────────────
  // COMPANY SUBSCRIPTION MANAGEMENT
  // ─────────────────────────────────────────────────────

  async getCompanySubscription(userId: string) {
    const employer = await this.resolveCompanyEmployer(userId);
    return {
      success: true,
      data: employer.subscription ? this.buildSubscriptionResponse(employer.subscription) : null,
    };
  }

  async assignCompanySubscription(
    userId: string,
    dto: {
      planId?: string;
      startDate?: string;
      expiryDate?: string;
      transactionId?: string;
      amount?: string | number;
      currency?: string;
      slotsOverride?: string | number;
    },
  ) {
    const employer = await this.resolveCompanyEmployer(userId);

    if (!dto.planId) {
      throw new BadRequestException('Plan is required');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found');
    }

    const startDate = this.normalizeDate(dto.startDate) ?? new Date();
    const expiryDate =
      this.normalizeDate(dto.expiryDate) ??
      new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.employerSubscription.upsert({
      where: { employerId: employer.id },
      update: {
        planId: plan.id,
        slotsOverride: this.resolveSlots(plan.slotsAvailable, dto.slotsOverride),
        startDate,
        expiryDate,
        isActive: true,
      },
      create: {
        employerId: employer.id,
        planId: plan.id,
        slotsOverride: this.resolveSlots(plan.slotsAvailable, dto.slotsOverride),
        startDate,
        expiryDate,
        isActive: true,
      },
      include: { plan: true },
    });

    await this.createManualSubscriptionPayment({
      employerId: employer.id,
      planId: plan.id,
      amount: this.resolveAmount(plan.price, dto.amount),
      currency: dto.currency,
      transactionId: dto.transactionId,
      paidAt: startDate,
    });

    await this.syncEmployerJobsToSlots(employer.id, this.resolveSlots(plan.slotsAvailable, dto.slotsOverride));

    return {
      success: true,
      message: 'Company subscription assigned successfully',
      data: this.buildSubscriptionResponse(subscription),
    };
  }

  async activateCompanySubscription(
    userId: string,
    dto: {
      planId?: string;
      startDate?: string;
      expiryDate?: string;
      transactionId?: string;
      amount?: string | number;
      currency?: string;
      slotsOverride?: string | number;
    },
  ) {
    const employer = await this.resolveCompanyEmployer(userId);
    const currentPlanId = employer.subscription?.planId ?? dto.planId;

    if (!currentPlanId) {
      throw new BadRequestException('Plan is required to activate a subscription');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: currentPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found');
    }

    const startDate = this.normalizeDate(dto.startDate) ?? employer.subscription?.startDate ?? new Date();
    const expiryDate =
      this.normalizeDate(dto.expiryDate) ??
      employer.subscription?.expiryDate ??
      new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.employerSubscription.upsert({
      where: { employerId: employer.id },
      update: {
        planId: plan.id,
        slotsOverride: this.resolveSlots(plan.slotsAvailable, dto.slotsOverride),
        startDate,
        expiryDate,
        isActive: true,
      },
      create: {
        employerId: employer.id,
        planId: plan.id,
        slotsOverride: this.resolveSlots(plan.slotsAvailable, dto.slotsOverride),
        startDate,
        expiryDate,
        isActive: true,
      },
      include: { plan: true },
    });

    await this.createManualSubscriptionPayment({
      employerId: employer.id,
      planId: plan.id,
      amount: this.resolveAmount(plan.price, dto.amount),
      currency: dto.currency,
      transactionId: dto.transactionId,
      paidAt: startDate,
    });

    await this.syncEmployerJobsToSlots(employer.id, this.resolveSlots(plan.slotsAvailable, dto.slotsOverride));

    return {
      success: true,
      message: 'Company subscription activated successfully',
      data: this.buildSubscriptionResponse(subscription),
    };
  }

  async extendCompanySubscription(
    userId: string,
    dto: {
      extendDays?: string | number;
      transactionId?: string;
      amount?: string | number;
      currency?: string;
      expiryDate?: string;
      slotsOverride?: string | number;
    },
  ) {
    const employer = await this.resolveCompanyEmployer(userId);
    if (!employer.subscription) {
      throw new NotFoundException('Company subscription not found');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: employer.subscription.planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found');
    }

    const expiryDate = this.normalizeDate(dto.expiryDate);
    if (!expiryDate) {
      throw new BadRequestException('Expiry date is required to extend a subscription');
    }

    const subscription = await this.prisma.employerSubscription.update({
      where: { employerId: employer.id },
      data: {
        slotsOverride: this.resolveSlots(plan.slotsAvailable, dto.slotsOverride ?? employer.subscription.slotsOverride ?? null),
        expiryDate,
        isActive: true,
      },
      include: { plan: true },
    });

    await this.createManualSubscriptionPayment({
      employerId: employer.id,
      planId: plan.id,
      amount: this.resolveAmount(plan.price, dto.amount),
      currency: dto.currency,
      transactionId: dto.transactionId,
      paidAt: new Date(),
    });

    await this.syncEmployerJobsToSlots(
      employer.id,
      this.resolveSlots(plan.slotsAvailable, dto.slotsOverride ?? employer.subscription.slotsOverride ?? null),
    );

    return {
      success: true,
      message: 'Company subscription extended successfully',
      data: this.buildSubscriptionResponse(subscription),
    };
  }

  async modifyCompanySubscription(
    userId: string,
    dto: {
      planId?: string;
      startDate?: string;
      expiryDate?: string;
      isActive?: boolean | string;
      transactionId?: string;
      amount?: string | number;
      currency?: string;
      slotsOverride?: string | number;
    },
  ) {
    const employer = await this.resolveCompanyEmployer(userId);

    const nextPlanId = dto.planId ?? employer.subscription?.planId;
    if (!nextPlanId) {
      throw new BadRequestException('Plan is required to modify a subscription');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: nextPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found');
    }

    if (!dto.expiryDate) {
      throw new BadRequestException('Expiry date is required to modify a subscription');
    }

    const startDate = this.normalizeDate(dto.startDate) ?? new Date();
    const expiryDate = this.normalizeDate(dto.expiryDate);
    if (!startDate || !expiryDate) {
      throw new BadRequestException('Invalid start date or expiry date');
    }
    const isActive =
      typeof dto.isActive === 'string'
        ? dto.isActive === 'true'
        : dto.isActive ?? employer.subscription?.isActive ?? true;
    const slotsOverride = this.resolveSlots(
      plan.slotsAvailable,
      dto.slotsOverride ?? employer.subscription?.slotsOverride ?? null,
    );

    const subscription = await this.prisma.employerSubscription.upsert({
      where: { employerId: employer.id },
      update: {
        planId: plan.id,
        slotsOverride,
        startDate,
        expiryDate,
        isActive,
      },
      create: {
        employerId: employer.id,
        planId: plan.id,
        slotsOverride,
        startDate,
        expiryDate,
        isActive,
      },
      include: { plan: true },
    });

    await this.createManualSubscriptionPayment({
      employerId: employer.id,
      planId: plan.id,
      amount: this.resolveAmount(plan.price, dto.amount),
      currency: dto.currency,
      transactionId: dto.transactionId,
      paidAt: startDate,
    });

    if (isActive) {
      await this.syncEmployerJobsToSlots(employer.id, slotsOverride);
    } else {
      await this.pauseEmployerJobs(employer.id);
    }

    return {
      success: true,
      message: 'Company subscription updated successfully',
      data: this.buildSubscriptionResponse(subscription),
    };
  }

  async cancelCompanySubscription(
    userId: string,
    dto: {
      reason?: string;
    },
  ) {
    const employer = await this.resolveCompanyEmployer(userId);
    if (!employer.subscription) {
      throw new NotFoundException('Company subscription not found');
    }

    const subscription = await this.prisma.employerSubscription.update({
      where: { employerId: employer.id },
      data: {
        isActive: false,
        expiryDate: new Date(),
      },
      include: { plan: true },
    });

    await this.pauseEmployerJobs(employer.id);

    return {
      success: true,
      message: dto.reason
        ? `Company subscription cancelled successfully: ${dto.reason}`
        : 'Company subscription cancelled successfully',
      data: this.buildSubscriptionResponse(subscription),
    };
  }
}
