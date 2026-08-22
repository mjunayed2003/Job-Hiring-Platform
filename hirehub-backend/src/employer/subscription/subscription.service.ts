import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common/exceptions';
import { v4 as uuidv4 } from 'uuid';
import { CreateSubscriptionPaymentDto } from './dto/subscription-payment.dto';
import { Cron } from '@nestjs/schedule';


@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) { }

  // Run once every day at 12:00 AM (Asia/Dhaka)
  @Cron('0 0 * * *', { timeZone: 'Asia/Dhaka' })
  async syncSubscriptionAndJobStatusesDaily() {
    const now = new Date();

    const expiredSubs = await this.prisma.employerSubscription.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: now },
      },
      select: { employerId: true },
    });

    if (expiredSubs.length > 0) {
      const employerIds = [...new Set(expiredSubs.map((s) => s.employerId))];

      await this.prisma.employerSubscription.updateMany({
        where: {
          employerId: { in: employerIds },
          isActive: true,
          expiryDate: { lte: now },
        },
        data: { isActive: false },
      });

      await this.prisma.job.updateMany({
        where: {
          employerId: { in: employerIds },
          status: 'OPEN',
        },
        data: { status: 'PAUSED' },
      });
    }

    const activeSubs = await this.prisma.employerSubscription.findMany({
      where: {
        isActive: true,
        expiryDate: { gt: now },
      },
      include: { plan: true },
    });

    for (const sub of activeSubs) {
      await this.resumePausedJobsByPlanSlots(sub.employerId, sub.plan.slotsAvailable);
    }
  }

  private async markExpiredSubscriptionAndPauseJobs(employerId: string) {
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

  private async resumePausedJobsByPlanSlots(employerId: string, slotsAvailable: number) {
    const openCount = await this.prisma.job.count({
      where: { employerId, status: 'OPEN' },
    });

    const canResume = Math.max(slotsAvailable - openCount, 0);
    if (canResume === 0) return;

    const pausedJobs = await this.prisma.job.findMany({
      where: {
        employerId,
        status: 'PAUSED',
      },
      orderBy: { updatedAt: 'desc' },
      take: canResume,
      select: { id: true },
    });

    if (pausedJobs.length === 0) return;

    await this.prisma.job.updateMany({
      where: {
        id: { in: pausedJobs.map((job) => job.id) },
      },
      data: { status: 'OPEN' },
    });
  }

  //  available plans
  async getAvailablePlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return { success: true, data: plans };
  }

  // Manual subscription activation (fallback if webhook fails)
  // Normally activated automatically via handleSubscriptionReturn webhook
  async purchasePlan(userId: string, planId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const paidPayment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        employerId: employer.id,
        planId: plan.id,
        status: 'PAID',
      },
      orderBy: { paidAt: 'desc' },
    });

    if (!paidPayment) {
      throw new BadRequestException('Please complete payment first to activate this subscription');
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    const subscription = await this.prisma.employerSubscription.upsert({
      where: { employerId: employer.id },
      update: {
        planId: plan.id,
        startDate: new Date(),
        expiryDate,
        isActive: true,
      },
      create: {
        employerId: employer.id,
        planId: plan.id,
        expiryDate,
        isActive: true,
      },
      include: { plan: true },
    });

    await this.resumePausedJobsByPlanSlots(employer.id, subscription.plan.slotsAvailable);

    return { success: true, data: subscription };
  }

  // Active subscription দেখা
  async getActiveSub(userId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    await this.markExpiredSubscriptionAndPauseJobs(employer.id);

    const sub = await this.prisma.employerSubscription.findFirst({
      where: {
        employerId: employer.id,
        isActive: true,
        expiryDate: { gt: new Date() },
      },
      include: { plan: true },
    });

    if (!sub) return { success: true, data: null };

    const remainingDays = Math.ceil(
      (new Date(sub.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      success: true,
      data: {
        planName: sub.plan.name,
        price: sub.plan.price,
        duration: sub.plan.duration,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        slotsAvailable: sub.plan.slotsAvailable,
        features: sub.plan.features,
        remainingDays,
      },
    };
  }

  async getPaidUsableSubscriptions(userId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const currentSub = await this.prisma.employerSubscription.findFirst({
      where: {
        employerId: employer.id,
        isActive: true,
        expiryDate: { gt: new Date() },
      },
      include: { plan: true },
    });

    const paidPayments = await this.prisma.subscriptionPayment.findMany({
      where: {
        employerId: employer.id,
        status: 'PAID',
      },
      include: { plan: true },
      orderBy: { paidAt: 'desc' },
    });

    const usableSubscriptions = paidPayments
      .map((payment) => {
        const startDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + payment.plan.duration);

        const remainingDays = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        return {
          orderId: payment.orderId,
          planId: payment.planId,
          planName: payment.plan.name,
          price: payment.plan.price,
          duration: payment.plan.duration,
          slotsAvailable: payment.plan.slotsAvailable,
          features: payment.plan.features,
          startDate,
          expiryDate,
          remainingDays,
          isCurrent:
            !!currentSub &&
            currentSub.planId === payment.planId &&
            new Date(currentSub.startDate).getTime() === startDate.getTime() &&
            new Date(currentSub.expiryDate).getTime() === expiryDate.getTime(),
        };
      })
      .filter((item) => item.expiryDate > new Date());

    return {
      success: true,
      data: usableSubscriptions,
    };
  }

  async switchToPaidSubscription(userId: string, orderId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const payment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        orderId,
        employerId: employer.id,
        status: 'PAID',
      },
      include: { plan: true },
    });

    if (!payment) {
      throw new NotFoundException('Paid subscription payment not found');
    }

    const startDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + payment.plan.duration);

    if (expiryDate <= new Date()) {
      throw new BadRequestException('This subscription is expired and cannot be switched');
    }

    const subscription = await this.prisma.employerSubscription.upsert({
      where: { employerId: employer.id },
      update: {
        planId: payment.planId,
        startDate,
        expiryDate,
        isActive: true,
      },
      create: {
        employerId: employer.id,
        planId: payment.planId,
        startDate,
        expiryDate,
        isActive: true,
      },
      include: { plan: true },
    });

    await this.resumePausedJobsByPlanSlots(employer.id, subscription.plan.slotsAvailable);

    return {
      success: true,
      message: 'Subscription switched successfully',
      data: subscription,
    };
  }



  // ─── HELPER: PowerTranz Headers ───
  private getPTZHeaders() {
    return {
      'Content-Type': 'application/json',
      'PowerTranz-PowerTranzId': process.env.PTZ_POWERTRANZ_ID!,
      'PowerTranz-PowerTranzPassword': process.env.PTZ_PROCESSING_PASSWORD!,
    };
  }

  private getBaseUrl(): string {
    const endpoint = process.env.PTZ_ENDPOINT!;
    if (!endpoint) throw new BadRequestException('PTZ_ENDPOINT is not configured');
    return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  }

  private buildRedirectUrl(baseUrl: string, path: string) {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  private getWebhookSecret() {
    const secret =
      process.env.REVENUECAT_WEBHOOK_SECRET ||
      process.env.PTZ_WEBHOOK_SECRET ||
      process.env.PTZ_SUBSCRIPTION_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('PTZ_WEBHOOK_SECRET is not configured');
    }
    return secret;
  }

  private normalizeHeaderValue(value: string) {
    return value.replace(/^Bearer\s+/i, '').trim();
  }

  private isPowerTranzPayload(body: Record<string, string>) {
    return Boolean(body.OrderIdentifier || body.TransactionIdentifier || body.SpiToken || body.IsoResponseCode);
  }

  private isRevenueCatPayload(body: Record<string, string>) {
    return Boolean(
      body.event_type ||
      body.event ||
      body.type ||
      body.app_user_id ||
      body.original_app_user_id ||
      body.product_id ||
      body.entitlement_id,
    );
  }

  private async getRevenueCatPlan(productId?: string | null) {
    if (!productId) return null;

    return this.prisma.subscriptionPlan.findFirst({
      where: {
        revenueCatProductId: productId,
        isActive: true,
      },
    });
  }

  private isRevenueCatActivationEvent(eventType?: string | null) {
    if (!eventType) return false;
    const normalized = eventType.toUpperCase();
    return [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
      'PRODUCT_CHANGE',
    ].includes(normalized);
  }

  // ─── 1. Payment URL  ───
  async createSubscriptionPaymentUrl(
    userId: string,
    dto: CreateSubscriptionPaymentDto,
  ) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!employer) throw new NotFoundException('Employer profile not found');

    await this.markExpiredSubscriptionAndPauseJobs(employer.id);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // Renewal check - allow payment if previous subscription expired
    const activeSub = await this.prisma.employerSubscription.findFirst({
      where: {
        employerId: employer.id,
        planId: plan.id,
        isActive: true,
        expiryDate: { gt: new Date() }, // Only block if NOT expired
      },
    });
    if (activeSub) {
      throw new BadRequestException('You already have an active subscription for this plan');
    }

    // Check for existing payment (prevent double charge)
    // আগে পুরো existingPayment block

    // পরে
    const existingPayment = await this.prisma.subscriptionPayment.findFirst({
      where: { employerId: employer.id, planId: plan.id, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment?.status === 'PAID') {
      const startDate = existingPayment.paidAt ? new Date(existingPayment.paidAt) : new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + plan.duration);

      const subscription = await this.prisma.employerSubscription.upsert({
        where: { employerId: employer.id },
        update: { planId: plan.id, startDate, expiryDate, isActive: true },
        create: { employerId: employer.id, planId: plan.id, startDate, expiryDate, isActive: true },
        include: { plan: true },
      });

      await this.resumePausedJobsByPlanSlots(employer.id, subscription.plan.slotsAvailable);

      return {
        success: true,
        autoActivated: true,
        message: 'Existing paid payment found. Subscription activated automatically.',
        data: subscription,
      };
    }

    const orderId = uuidv4();
    const currencyCode = process.env.PTZ_CURRENCY_CODE || '388';
    const successRedirectUrl = process.env.FRONTEND_SUCCESS_URL_SUBSCRIPTION!;
    const failedRedirectUrl = process.env.FRONTEND_FAILED_URL_SUBSCRIPTION!;

    // DB  PENDING save
    const pendingPayment = await this.prisma.subscriptionPayment.findFirst({
      where: { employerId: employer.id, planId: plan.id, status: 'PENDING' },
    });

    if (pendingPayment) {
      await this.prisma.subscriptionPayment.update({
        where: { orderId: pendingPayment.orderId },
        data: {
          orderId,
          amount: plan.price,
          status: 'PENDING',
          successRedirectUrl,
          failedRedirectUrl,
        },
      });
    } else {
      await this.prisma.subscriptionPayment.create({
        data: {
          orderId,
          amount: plan.price,
          currency: currencyCode === '388' ? 'JMD' : 'USD',
          status: 'PENDING',
          employerId: employer.id,
          planId: plan.id,
          successRedirectUrl,
          failedRedirectUrl,
        },
      });
    }

    const merchantResponseUrl =
      process.env.PTZ_SUBSCRIPTION_RETURN_URL || process.env.PTZ_RETURN_URL;
    if (!merchantResponseUrl) {
      throw new BadRequestException(
        'PTZ_SUBSCRIPTION_RETURN_URL or PTZ_RETURN_URL is not configured',
      );
    }

    const pageSet = process.env.PTZ_PAGE_SET;
    const pageName = process.env.PTZ_PAGE_NAME;

    // PowerTranz HPP Payload
    const payload = {
      TransactionIdentifier: orderId,
      TotalAmount: parseFloat(plan.price.toFixed(2)),
      CurrencyCode: currencyCode,
      ThreeDSecure: true,
      Source: {},
      OrderIdentifier: orderId,
      BillingAddress: {
        FirstName: employer.fullName || 'Customer',
        EmailAddress: '',
      },
      AddressMatch: false,
      ExtendedData: {
        ThreeDSecure: {
          ChallengeWindowSize: 4,
          ChallengeIndicator: '01',
        },
        MerchantResponseUrl: merchantResponseUrl,
        HostedPage: { PageSet: pageSet, PageName: pageName },
      },
    };

    let data: any = {};
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}Api/spi/sale`, {
        method: 'POST',
        headers: this.getPTZHeaders(),
        body: JSON.stringify(payload),
      });

      const rawResponse = await response.text();
      if (rawResponse) data = JSON.parse(rawResponse);

      if (!response.ok || data.IsoResponseCode !== 'SP4') {
        throw new BadRequestException(
          data?.Errors?.[0]?.Message || `Gateway error: ${data?.IsoResponseCode}`,
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Network error: ${err.message}`);
    }

    // SpiToken save
    await this.prisma.subscriptionPayment.update({
      where: { orderId },
      data: { transactionId: data.SpiToken ?? null },
    });

    return {
      success: true,
      redirectData: data.RedirectData,
      spiToken: data.SpiToken,
      summary: {
        planName: plan.name,
        amount: plan.price,
        currency: currencyCode === '388' ? 'JMD' : 'USD',
        orderId,
      },
    };
  }

  // ─── 2. PowerTranz Return Handler ───
  async handleSubscriptionReturn(body: Record<string, string>) {
    let responseData: any = {};
    if (body.Response) {
      try { responseData = JSON.parse(body.Response); } catch { }
    }

    const OrderIdentifier =
      responseData.OrderIdentifier ||
      body.TransactionIdentifier ||
      body.OrderIdentifier;

    const SpiToken = responseData.SpiToken || body.SpiToken;
    const IsoResponseCode = responseData.IsoResponseCode;

    if (!OrderIdentifier) throw new BadRequestException('Missing OrderIdentifier');

    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { orderId: OrderIdentifier },
      include: { plan: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const frontendSuccess = payment.successRedirectUrl || process.env.FRONTEND_SUCCESS_URL_SUBSCRIPTION!;
    const frontendFailed = payment.failedRedirectUrl || process.env.FRONTEND_FAILED_URL_SUBSCRIPTION!;

    // 3DS complete — Step 2: payment completion
    if (IsoResponseCode === '3D0' || IsoResponseCode === 'SP1') {
      try {
        const baseUrl = this.getBaseUrl();
        const payResponse = await fetch(`${baseUrl}Api/spi/payment`, {
          method: 'POST',
          headers: this.getPTZHeaders(),
          body: JSON.stringify(SpiToken),
        });
        const payData = await payResponse.json();

        if (payData.IsoResponseCode === '00') {
          // Payment success — activate subscription
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + payment.plan.duration);

          try {
            await this.prisma.$transaction([
              // Update payment status
              this.prisma.subscriptionPayment.update({
                where: { orderId: OrderIdentifier },
                data: { status: 'PAID', paidAt: new Date(), transactionId: SpiToken },
              }),
              // Create/update subscription
              this.prisma.employerSubscription.upsert({
                where: { employerId: payment.employerId },
                update: {
                  planId: payment.planId,
                  startDate: new Date(),
                  expiryDate,
                  isActive: true,
                },
                create: {
                  employerId: payment.employerId,
                  planId: payment.planId,
                  expiryDate,
                  isActive: true,
                },
              }),
            ]);

            await this.resumePausedJobsByPlanSlots(payment.employerId, payment.plan.slotsAvailable);
          } catch (err) {
            console.error(`[Subscription] Activation failed for order ${OrderIdentifier}:`, err);
            throw err;
          }

          return { redirect: `${frontendSuccess}?orderId=${OrderIdentifier}` };
        } else {
          await this.prisma.subscriptionPayment.update({
            where: { orderId: OrderIdentifier },
            data: { status: 'FAILED' },
          });
          return {
            redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=${payData.ResponseMessage || 'Payment declined'}`,
          };
        }
      } catch (err) {
        console.error(`[Subscription] Payment completion failed for order ${OrderIdentifier}:`, err);
        await this.prisma.subscriptionPayment.update({
          where: { orderId: OrderIdentifier },
          data: { status: 'FAILED' },
        });
        return { redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=Payment failed` };
      }
    }

    // Failed
    await this.prisma.subscriptionPayment.update({
      where: { orderId: OrderIdentifier },
      data: { status: 'FAILED' },
    });
    return {
      redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=${responseData.ResponseMessage || 'Payment failed'}`,
    };
  }

  async handleSubscriptionWebhook(
    body: Record<string, string>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const providedSecret = this.normalizeHeaderValue(String(
      headers.authorization ||
      headers['x-webhook-secret'] ||
      headers['x-ptz-webhook-secret'] ||
      '',
    ));
    const expectedSecret = this.getWebhookSecret();

    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new BadRequestException('Invalid webhook secret');
    }

    if (this.isPowerTranzPayload(body)) {
      const result = await this.handleSubscriptionReturn(body);
      return {
        success: true,
        provider: 'powertranz',
        message: 'Webhook processed successfully',
        data: result,
      };
    }

    if (this.isRevenueCatPayload(body)) {
      // RevenueCat sends the actual event data nested under `event`,
      // e.g. { api_version, event: { type, app_user_id, product_id, ... } }
      const event: Record<string, any> = (body as any).event || body;

      const appUserId = event.app_user_id || event.original_app_user_id || '';
      const productId = event.product_id || null;
      const eventType = event.type || event.event_type || null;
      const plan = await this.getRevenueCatPlan(productId);

      if (!appUserId) {
        return {
          success: true,
          provider: 'revenuecat',
          message: 'RevenueCat webhook received but app_user_id was missing',
        };
      }

      if (plan && this.isRevenueCatActivationEvent(eventType)) {
        const employer = await this.prisma.employerProfile.findUnique({
          where: { userId: appUserId },
        });

        if (employer && plan) {
          const startDate = new Date();
          const expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + plan.duration);

          let subscription;

          try {
            subscription = await this.prisma.employerSubscription.upsert({
              where: { employerId: employer.id },
              update: {
                planId: plan.id,
                startDate,
                expiryDate,
                isActive: true,
              },
              create: {
                employerId: employer.id,
                planId: plan.id,
                startDate,
                expiryDate,
                isActive: true,
              },
              include: { plan: true },
            });
          } catch (error: any) {
            // Prisma upsert can still race if the webhook is delivered twice at the same time.
            if (error?.code !== 'P2002') throw error;

            subscription = await this.prisma.employerSubscription.update({
              where: { employerId: employer.id },
              data: {
                planId: plan.id,
                startDate,
                expiryDate,
                isActive: true,
              },
              include: { plan: true },
            });
          }

          await this.resumePausedJobsByPlanSlots(employer.id, subscription.plan.slotsAvailable);

          return {
              success: true,
              provider: 'revenuecat',
              message: 'RevenueCat subscription activated',
              data: {
                appUserId,
                productId,
                planId: plan.id,
                eventType,
                subscriptionId: subscription.id,
              },
            };
          }
      }

      return {
          success: true,
          provider: 'revenuecat',
          message: 'RevenueCat webhook received',
          data: {
          eventType,
          appUserId,
          productId,
          planId: plan?.id || null,
          entitlementId: event.entitlement_id || null,
          transactionId: event.transaction_id || event.transaction_id_aliases?.[0] || null,
        },
      };
    }

    return {
      success: true,
      provider: 'unknown',
      message: 'Webhook received but payload format was not recognized',
    };
  }

  async deleteSubscription(subscriptionId: string) {
    const subscription = await this.prisma.employerSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    await this.prisma.employerSubscription.delete({
      where: { id: subscriptionId },
    });

    if (subscription.isActive) {
      await this.prisma.job.updateMany({
        where: {
          employerId: subscription.employerId,
          status: 'OPEN',
        },
        data: { status: 'PAUSED' },
      });
    }

    return { success: true, message: 'Subscription deleted successfully' };
  }
}
