import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminWithdrawActionDto } from './dto/wallet.dto';
import { MailService } from 'src/admin/admin-mail/mail.service';

@Injectable()
export class AdminWalletService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

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

  private getAdminNotifyEmail() {
    return process.env.ADMIN_NOTIFY_EMAIL || process.env.MAIL_USER || '';
  }

  // ─────────────────────────────────────────
  // 1. ALL WITHDRAW REQUESTS (Admin)
  // ─────────────────────────────────────────
  async getAllWithdrawRequests(
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status } : {};

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
            select: {
              balance: true, // ✅ balance এখন সঠিকভাবে আসবে
              jobSeeker: {
                select: {
                  id: true,
                  fullName: true,
                  profilePic: true,
                  phone: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        accountHolderName: r.accountHolderName,
        bankName: r.bankName,
        branch: r.branch,
        accountType: r.accountType,
        accountNumber: r.accountNumber,
        canApprove: r.status === 'PENDING',
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt,
        payment: this.formatPaymentContext(r.payment),
        job: this.formatPaymentContext(r.payment)?.job ?? null,
        employer: this.formatPaymentContext(r.payment)?.employer ?? null,
        jobSeeker: {
          id: r.wallet.jobSeeker.id,
          fullName: r.wallet.jobSeeker.fullName,
          profilePic: r.wallet.jobSeeker.profilePic,
          phone: r.wallet.jobSeeker.phone,
          email: r.wallet.jobSeeker.user.email,
          walletBalance: Number(r.wallet.balance), // ✅ এখন কাজ করবে
        },
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // ─────────────────────────────────────────
  // 2. APPROVE or REJECT
  // ─────────────────────────────────────────
  async processWithdrawRequest(id: string, dto: AdminWithdrawActionDto) {
    const request = await this.prisma.withdrawRequest.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            jobSeeker: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
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

    if (!request) throw new NotFoundException('Withdraw request not found');

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Request is already ${request.status.toLowerCase()}`,
      );
    }

    if (dto.status === 'APPROVED') {
      const adminNote = dto.adminNote;

      const balance = Number(request.wallet.balance);
      const numericAmount = Number(request.amount);

      if (numericAmount > balance) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ${balance} JMD`,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // ✅ dto.adminNote → adminNote (variable) use করছি
        const approvedRequest = await tx.withdrawRequest.update({
          where: { id },
          data: { status: 'APPROVED', adminNote },
        });

        await tx.wallet.update({
          where: { id: request.walletId },
          data: { balance: { decrement: numericAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: request.walletId,
            type: 'DEBIT',
            amount: numericAmount,
            note: `Withdrawal approved — ${request.bankName} (${request.accountNumber})`,
          },
        });

        const remainingBalance = balance - numericAmount;
        const pendingRequests = await tx.withdrawRequest.findMany({
          where: {
            walletId: request.walletId,
            status: 'PENDING',
            id: { not: id },
          },
          orderBy: { createdAt: 'asc' },
        });

        let availableAfterApproval = remainingBalance;
        const failedRequests: Array<{ id: string; amount: number }> = [];

        for (const pendingRequest of pendingRequests) {
          const pendingAmount = Number(pendingRequest.amount);
          if (pendingAmount <= availableAfterApproval) {
            availableAfterApproval -= pendingAmount;
            continue;
          }
          failedRequests.push({ id: pendingRequest.id, amount: pendingAmount });
        }

        if (failedRequests.length > 0) {
          await tx.withdrawRequest.updateMany({
            where: { id: { in: failedRequests.map((item) => item.id) } },
            data: {
              status: 'FAILED',
              adminNote:
                'Failed automatically because wallet balance became insufficient after a previous approval.',
            },
          });
        }

        return { approvedRequest, failedRequests };
      });

      const employer = request.payment?.interview?.application?.job?.employer;
      const jobSeeker = request.wallet?.jobSeeker;
      const orderId = request.payment?.orderId ?? '';
      const requestId = request.id;
      const amount = `JMD ${Number(request.amount).toLocaleString()}`;
      const jobTitle =
        request.payment?.interview?.application?.job?.title || 'N/A';
      const employerName =
        employer?.companyName || employer?.fullName || 'Employer';
      const jobSeekerName = jobSeeker?.fullName || 'Job Seeker';

      await Promise.allSettled([
        employer?.user?.email
          ? this.mailService.sendWithdrawRequestApprovedMail(
            employer.user.email,
            employerName,
            orderId,
            requestId,
            jobSeekerName,
            employerName,
            jobTitle,
            amount,
          )
          : Promise.resolve(),
        jobSeeker?.user?.email
          ? this.mailService.sendWithdrawRequestApprovedMail(
            jobSeeker.user.email,
            jobSeekerName,
            orderId,
            requestId,
            jobSeekerName,
            employerName,
            jobTitle,
            amount,
          )
          : Promise.resolve(),
      ]);

      return {
        message: 'Withdraw request approved and balance deducted',
        failedRequestsCount: result.failedRequests.length,
      };
    }

    // ─────────────────────────────────────────
    // REJECTED
    // ─────────────────────────────────────────
    await this.prisma.withdrawRequest.update({
      where: { id },
      data: { status: 'REJECTED', adminNote: dto.adminNote },
    });

    return { message: 'Withdraw request rejected' };
  }
}
