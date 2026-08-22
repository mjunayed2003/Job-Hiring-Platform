import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { WithdrawRequestDto } from './dto/wallet.dto';
import { MailService } from 'src/admin/admin-mail/mail.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  // ─────────────────────────────────────────
  // HELPER — jobseekerId
  // ─────────────────────────────────────────
  private async getJobSeekerId(userId: string): Promise<string> {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Job seeker profile not found');
    return profile.id;
  }

  private async getEmployerId(userId: string): Promise<string> {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');
    return profile.id;
  }

  // ─────────────────────────────────────────
  // HELPER — wallet
  // ─────────────────────────────────────────
  private async getOrCreateWallet(jobSeekerId: string) {
    return this.prisma.wallet.upsert({
      where: { jobSeekerId },
      update: {},
      create: { jobSeekerId, balance: 0 },
    });
  }

  private async getReservedWithdrawAmount(walletId: string) {
    const result = await this.prisma.withdrawRequest.aggregate({
      where: {
        walletId,
        status: 'PENDING',
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private formatPaymentContext(payment: any) {
    if (!payment) return null;

    const job = payment.interview?.application?.job;
    const employer = job?.employer;

    return {
      orderId: payment.orderId,
      paymentId: payment.id,
      paidAt: payment.paidAt,
      amount: Number(payment.amount),
      platformFee: Number(payment.platformFee),
      netAmount: Number(payment.amount) - Number(payment.platformFee),
      job: job
        ? {
          id: job.id,
          title: job.title,
          location: job.location,
          salaryType: job.salaryType,
          salaryFrequency: job.salaryFrequency,
          salaryAmount: job.salaryAmount,
        }
        : null,
      employer: employer
        ? {
          id: employer.id,
          fullName: employer.fullName,
          companyName: employer.companyName,
          phone: employer.phone,
          email: employer.user?.email,
        }
        : null,
    };
  }

  private formatEmployerWithdrawRequest(request: any) {
    const payment = this.formatPaymentContext(request.payment);
    const jobSeeker = request.wallet?.jobSeeker;

    return {
      id: request.id,
      amount: Number(request.amount),
      status: request.status,
      createdAt: request.createdAt,
      payment,
      job: payment?.job ?? null,
      employer: payment?.employer ?? null,
      jobSeeker: jobSeeker
        ? {
          id: jobSeeker.id,
          fullName: jobSeeker.fullName,
          profilePic: jobSeeker.profilePic,
          phone: jobSeeker.phone,
          email: jobSeeker.user?.email,
        }
        : null,
    };
  }

  private getAdminNotifyEmail() {
    return process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_USER || '';
  }

  private async sendWithdrawRequestSubmittedEmails(
    payment: any,
    request: any,
    jobSeekerId: string,
  ) {
    if (!payment) return;

    const jobSeeker = await this.prisma.jobSeekerProfile.findUnique({
      where: { id: jobSeekerId },
      include: { user: { select: { email: true } } },
    });

    if (!jobSeeker?.user?.email) return;

    const orderId = payment.orderId ?? '';
    const requestId = request.id;
    const amount = `JMD ${Number(request.amount).toLocaleString()}`;
    const jobTitle = payment.interview?.application?.job?.title || 'N/A';
    const employer = payment.interview?.application?.job?.employer;
    const employerName = employer?.companyName || employer?.fullName || 'Employer';
    const jobSeekerName = jobSeeker.fullName || 'Job Seeker';

    await Promise.allSettled([
      this.mailService.sendWithdrawRequestSubmittedMail(
        jobSeeker.user.email,
        jobSeekerName,
        orderId,
        requestId,
        jobSeekerName,
        employerName,
        jobTitle,
        amount,
      ),
      this.getAdminNotifyEmail()
        ? this.mailService.sendWithdrawRequestSubmittedMail(
          this.getAdminNotifyEmail(),
          'HireHub JA Administration Team',
          orderId,
          requestId,
          jobSeekerName,
          employerName,
          jobTitle,
          amount,
        )
        : Promise.resolve(),
    ]);
  }

  private async getWithdrawContextPayment(jobSeekerId: string, paymentId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        ...(paymentId ? { id: paymentId } : {}),
        candidateId: jobSeekerId,
        status: PaymentStatus.PAID,
      },
      orderBy: { paidAt: 'desc' },
      include: {
        interview: {
          include: {
            application: {
              include: {
                job: {
                  include: {
                    employer: {
                      include: {
                        user: { select: { email: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return payment ?? null;
  }

  // ─────────────────────────────────────────
  // 1. WALLET BALANCE + RECENT HISTORY
  // ─────────────────────────────────────────
  async getWallet(userId: string) {
    const jobSeekerId = await this.getJobSeekerId(userId);
    const wallet = await this.getOrCreateWallet(jobSeekerId);

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      recentHistory: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        note: t.note,
        createdAt: t.createdAt,
      })),
    };
  }

  // ─────────────────────────────────────────
  // 2. SUBMIT WITHDRAW REQUEST
  // ─────────────────────────────────────────
  async submitWithdrawRequest(userId: string, dto: WithdrawRequestDto) {
    const jobSeekerId = await this.getJobSeekerId(userId);
    const wallet = await this.getOrCreateWallet(jobSeekerId);
    const payment = await this.getWithdrawContextPayment(jobSeekerId, dto.paymentId);

    if (!payment) {
      throw new BadRequestException(
        'No completed payment found for this withdraw request.',
      );
    }

    // ✅ এই payment থেকে কতটুকু already withdraw করা হয়েছে
    const alreadyWithdrawnResult = await this.prisma.withdrawRequest.aggregate({
      where: {
        paymentId: payment.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      _sum: { amount: true },
    });

    const totalWithdrawn = Number(alreadyWithdrawnResult._sum.amount ?? 0);
    const netPaymentAmount = Number(payment.amount) - Number(payment.platformFee);
    const remainingFromPayment = netPaymentAmount - totalWithdrawn;

    if (dto.amount > remainingFromPayment) {
      throw new BadRequestException(
      `Exceeds remaining withdrawable amount. Remaining: ${remainingFromPayment} JMD`,
      );
    }

    if (!payment.candidateCompletedAt) {
      throw new BadRequestException(
        'Please mark the job as completed before requesting a withdraw.',
      );
    }

    if (!payment.employerCompletedAt) {
      throw new BadRequestException(
        'Employer must confirm completion before requesting a withdraw.',
      );
    }

    // ✅ Wallet balance check
    const balance = Number(wallet.balance);
    const reservedAmount = await this.getReservedWithdrawAmount(wallet.id);
    const availableBalance = balance - reservedAmount;

    if (dto.amount > availableBalance) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${availableBalance} JMD`,
      );
    }

    const request = await this.prisma.withdrawRequest.create({
      data: {
        walletId: wallet.id,
        paymentId: payment.id,
        amount: dto.amount,
        accountHolderName: dto.accountHolderName,
        bankName: dto.bankName,
        branch: dto.branch,
        accountType: dto.accountType,
        accountNumber: dto.accountNumber,
        status: 'PENDING',
      },
    });

    void this.sendWithdrawRequestSubmittedEmails(payment, request, jobSeekerId);

    return {
      message: 'Withdraw request submitted successfully',
      requestId: request.id,
      amount: Number(request.amount),
      status: request.status,
      employerConfirmedMessage: 'Waiting for admin approval',
      canAdminApprove: request.status === 'PENDING',
      availableBalance: availableBalance - dto.amount,
      remainingFromPayment: remainingFromPayment - dto.amount,
      payment: this.formatPaymentContext(payment),
    };
  }

  // ─────────────────────────────────────────
  // 3. JOBSEEKER — MY WITHDRAW REQUESTS
  // ─────────────────────────────────────────
  async getMyWithdrawRequests(userId: string) {
    const jobSeekerId = await this.getJobSeekerId(userId);
    const wallet = await this.getOrCreateWallet(jobSeekerId);

    const requests = await this.prisma.withdrawRequest.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      include: {
        payment: {
          include: {
            interview: {
              include: {
                application: {
                  include: {
                    job: {
                      include: {
                        employer: {
                          include: {
                            user: { select: { email: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      accountHolderName: r.accountHolderName,
      bankName: r.bankName,
      branch: r.branch,
      accountType: r.accountType,
      accountNumber: r.accountNumber,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      payment: this.formatPaymentContext(r.payment),
      job: this.formatPaymentContext(r.payment)?.job ?? null,
      employer: this.formatPaymentContext(r.payment)?.employer ?? null,
    }));
  }

  // ─────────────────────────────────────────
  // 4. EMPLOYER — WITHDRAW REQUESTS
  // ─────────────────────────────────────────
  async getEmployerWithdrawRequests(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const employerId = await this.getEmployerId(userId);
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      payment: {
        is: {
          employerId,
        },
      },
      ...(status ? { status } : {}),
    };

    const [total, requests] = await Promise.all([
      this.prisma.withdrawRequest.count({ where }),
      this.prisma.withdrawRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            include: {
              interview: {
                include: {
                  application: {
                    include: {
                      job: {
                        include: {
                          employer: {
                            include: {
                              user: { select: { email: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          wallet: {
            include: {
              jobSeeker: {
                include: {
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: requests.map((r) => this.formatEmployerWithdrawRequest(r)),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // ─────────────────────────────────────────
  // 5. EMPLOYER — CONFIRM WITHDRAW REQUEST
  // ─────────────────────────────────────────
  async confirmEmployerWithdrawRequest(userId: string, requestId: string) {
    const employerId = await this.getEmployerId(userId);

    const request = await this.prisma.withdrawRequest.findUnique({
      where: { id: requestId },
      include: {
        payment: true,
        wallet: {
          include: {
            jobSeeker: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Withdraw request not found');

    if (!request.payment || request.payment.employerId !== employerId) {
      throw new NotFoundException('Withdraw request not found for this employer');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    return {
      message: 'Employer confirmation is no longer required for withdraw requests',
      data: this.formatEmployerWithdrawRequest(request),
    };
  }

  // ─────────────────────────────────────────
  // 6. PAYMENT COMPLETE → WALLET CREDIT
  //    (payment.service.ts থেকে call হয়)
  // ─────────────────────────────────────────
  async creditWalletAfterPayment(
    jobSeekerId: string,
    grossAmount: number,
    platformFee: number,
    note: string,
  ) {
    const netAmount = grossAmount - platformFee;
    const wallet = await this.getOrCreateWallet(jobSeekerId);

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: netAmount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount: netAmount,
          note,
        },
      }),
    ]);
  }
}
