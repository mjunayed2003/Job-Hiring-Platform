import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InterviewStatus, UserRole } from '../generated/prisma/client';
import { WalletService } from 'src/wallet/wallet.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { MailService } from 'src/admin/admin-mail/mail.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) { }

  private buildRedirectUrl(baseUrl: string, path: string) {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  // ─────────────────────────────────────────────
  // HELPER — split a full name into First/Last for
  // PowerTranz BillingAddress / CardholderName fields
  // ─────────────────────────────────────────────
  private splitFullName(fullName?: string | null): { firstName: string; lastName: string } {
    const trimmed = (fullName || '').trim();
    if (!trimmed) return { firstName: 'Customer', lastName: '' };
    const parts = trimmed.split(/\s+/);
    const firstName = parts.shift() as string;
    const lastName = parts.join(' ');
    return { firstName, lastName };
  }

  // ─────────────────────────────────────────────
  // HELPER — PowerTranz Headers
  // ─────────────────────────────────────────────
  private getPTZHeaders() {
    return {
      'Content-Type': 'application/json',
      'PowerTranz-PowerTranzId': process.env.PTZ_POWERTRANZ_ID!,
      'PowerTranz-PowerTranzPassword': process.env.PTZ_PROCESSING_PASSWORD!,
    };
  }

  // ─────────────────────────────────────────────
  // HELPER — Base URL
  // ─────────────────────────────────────────────
  private getBaseUrl(): string {
    const endpoint = process.env.PTZ_ENDPOINT!;
    if (!endpoint) throw new BadRequestException('PTZ_ENDPOINT is not configured');
    return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  }

  // ─────────────────────────────────────────────
  // 1. CREATE PAYMENT URL (HPP — Step 1)
  //    POST /Api/spi/sale → RedirectData (HTML form)
  // ─────────────────────────────────────────────
  async createPaymentUrl(dto: CreatePaymentDto, employerUserId: string) {
    const employerUser = await this.prisma.user.findUnique({
      where: { id: employerUserId },
      select: { role: true, email: true },
    });

    if (employerUser?.role === UserRole.COMPANY) {
      throw new BadRequestException(
        'Company account does not require hire payment. Please purchase subscription only.',
      );
    }

    // ── Employer check ──
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { userId: employerUserId },
    });
    if (!employerProfile) throw new NotFoundException('Employer profile not found');

    // ── Interview check ──
    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
      include: {
        application: {
          include: {
            job: true,
            jobSeeker: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    if (interview.application.job.employerId !== employerProfile.id) {
      throw new ForbiddenException('You are not authorized for this interview');
    }

    if (interview.status !== InterviewStatus.COMPLETED) {
      throw new BadRequestException('Interview must be completed before making payment');
    }

    const successRedirectUrl = process.env.FRONTEND_SUCCESS_URL_HIRE!;
    const failedRedirectUrl = process.env.FRONTEND_FAILED_URL_HIRE!;

    // ── Duplicate payment check ──
    const existingPayment = await this.prisma.payment.findUnique({
      where: { interviewId: dto.interviewId },
    });
    if (existingPayment?.status === 'PAID') {
      throw new BadRequestException('Payment already completed for this hire');
    }

    // ── Amount calculate ──
    const salaryAmount = parseFloat(interview.application.job.salaryAmount || '0');
    const months = 1;
    const amount = salaryAmount * months;

    // No platform fee - charge only the original amount
    const platformFee = 0;
    const totalAmount = amount;

    const orderId = uuidv4();
    const currencyCode = process.env.PTZ_CURRENCY_CODE || '388'; // 388 = JMD

    // ── DB-তে PENDING payment save ──
    await this.prisma.payment.upsert({
      where: { interviewId: dto.interviewId },
      update: {
        orderId,
        amount,
        platformFee,
        totalAmount,
        status: 'PENDING',
        successRedirectUrl,
        failedRedirectUrl,
      },
      create: {
        orderId,
        amount,
        platformFee,
        totalAmount,
        currency: currencyCode === '388' ? 'JMD' : 'USD',
        status: 'PENDING',
        employerId: employerProfile.id,
        candidateId: interview.application.jobSeeker.id,
        interviewId: dto.interviewId,
        successRedirectUrl,
        failedRedirectUrl,
      },
    });

    // ── Env check ──
    const merchantResponseUrl = process.env.PTZ_RETURN_URL;
    if (!merchantResponseUrl) throw new BadRequestException('PTZ_RETURN_URL is not configured');

    const pageSet = process.env.PTZ_PAGE_SET;
    if (!pageSet) throw new BadRequestException('PTZ_PAGE_SET is not configured');

    const pageName = process.env.PTZ_PAGE_NAME;
    if (!pageName) throw new BadRequestException('PTZ_PAGE_NAME is not configured');

    // ── Cardholder / contact details for 3DS ──
    // VISA now requires CardholderName plus either PhoneNumber or
    // EmailAddress on every 3DS request (see PowerTranz feedback,
    // ticket 88806394). The EMPLOYER is the one paying (their card is
    // charged), so CardholderName / BillingAddress must reflect the
    // employer, not the job seeker — the job seeker only receives the
    // payout later. CardholderName goes on Source; BillingAddress
    // carries the name + a real (non-empty) email so the "either phone
    // or email" requirement is met.
    const { firstName, lastName } = this.splitFullName(
      employerProfile.fullName || employerProfile.companyName,
    );
    const cardholderName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();
    const billingEmail = (employerUser?.email || '').trim();
    const billingPhone = (employerProfile.phone || '').trim();

    if (!billingEmail && !billingPhone) {
      throw new BadRequestException(
        'Employer profile must have either an email or phone number for 3DS payment requests.',
      );
    }

    // ── HPP Payload ──
    const payload = {
      TransactionIdentifier: orderId,
      TotalAmount: parseFloat(totalAmount.toFixed(2)),
      CurrencyCode: currencyCode,
      ThreeDSecure: true,
      Source: {
        CardholderName: cardholderName,     // required by VISA for 3DS
      },
      OrderIdentifier: orderId,
      BillingAddress: {
        FirstName: firstName,
        LastName: lastName,
        ...(billingEmail ? { EmailAddress: billingEmail } : {}),
        ...(billingPhone ? { PhoneNumber: billingPhone } : {}),
        // PowerTranz/VISA wants at least one non-empty contact field here.
      },
      AddressMatch: false,
      ExtendedData: {
        ThreeDSecure: {
          ChallengeWindowSize: 4,
          ChallengeIndicator: '01',
        },
        MerchantResponseUrl: merchantResponseUrl,
        HostedPage: {
          PageSet: pageSet,
          PageName: pageName,
        },
      },
    };

    console.log('PTZ Payload:', JSON.stringify(payload, null, 2));
    console.log(`Hitting PTZ_ENDPOINT: ${process.env.PTZ_ENDPOINT} with ID: ${process.env.PTZ_POWERTRANZ_ID}`);

    // ── Step 1: POST /Api/spi/sale ──
    let data: any = {};
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}Api/spi/sale`, {
        method: 'POST',
        headers: this.getPTZHeaders(),
        body: JSON.stringify(payload),
      });

      const rawResponse = await response.text();

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch {
          throw new BadRequestException(
            `Payment provider returned invalid response: ${rawResponse.substring(0, 200)}`,
          );
        }
      }

      // IsoResponseCode "SP4" = Success (token generated, redirect ready)
      if (!response.ok || data.IsoResponseCode !== 'SP4') {
        throw new BadRequestException(
          data?.Errors?.[0]?.Message ||
          `Gateway error: ${data?.IsoResponseCode || response.status}`,
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Network error: ${err?.cause?.message || err.message}`,
      );
    }

    // ── SpiToken DB-তে save ──
    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: data.SpiToken ?? null },
    });

    // ── RedirectData (HTML form) frontend-
    return {
      success: true,
      redirectData: data.RedirectData,
      spiToken: data.SpiToken,
      summary: {
        candidateName: interview.application.jobSeeker.fullName,
        position: interview.application.job.title,
        agreedSalary: salaryAmount,
        months,
        amount,
        totalAmount,
        currency: currencyCode === '388' ? 'JMD' : 'USD',
        orderId,
      },
    };
  }

  // ─────────────────────────────────────────────
  // 2. MERCHANT RESPONSE URL HANDLER (HPP — Step 1.6)
  //    PowerTranz 3DS result
  //   
  // ─────────────────────────────────────────────
  async handleReturn(body: Record<string, string>) {
    let responseData: any = {};
    if (body.Response) {
      try {
        responseData = JSON.parse(body.Response);
      } catch { }
    }

    const OrderIdentifier =
      responseData.OrderIdentifier ||
      body.TransactionIdentifier ||
      body.OrderIdentifier;

    const SpiToken = responseData.SpiToken || body.SpiToken;
    const IsoResponseCode = responseData.IsoResponseCode;

    if (!OrderIdentifier) throw new BadRequestException('Invalid return data: missing OrderIdentifier');

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: OrderIdentifier },
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
                jobSeeker: {
                  include: {
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const frontendSuccess = payment.successRedirectUrl || process.env.FRONTEND_SUCCESS_URL_HIRE!;
    const frontendFailed = payment.failedRedirectUrl || process.env.FRONTEND_FAILED_URL_HIRE!;

    // ✅ 3DS complete — Step 2: payment completion
    if (IsoResponseCode === '3D0' || IsoResponseCode === 'SP1') {
      try {
        const baseUrl = this.getBaseUrl();
        const payResponse = await fetch(`${baseUrl}Api/spi/payment`, {
          method: 'POST',
          headers: this.getPTZHeaders(),
          body: JSON.stringify({ SpiToken }),
        });
        const payData = await payResponse.json();
        console.log('Payment completion response:', payData);

        if (payData.IsoResponseCode === '00') {
          const paidAmount = payment.amount?.toNumber?.() ?? Number(payment.amount ?? 0);
          const platformFee = paidAmount * 0.03;

          await this.prisma.$transaction([
            this.prisma.payment.update({
              where: { orderId: OrderIdentifier },
              data: { status: 'PAID', paidAt: new Date(), transactionId: SpiToken, platformFee },
            }),
            this.prisma.interview.update({
              where: { id: payment.interviewId },
              data: {
                status: InterviewStatus.HIRED,
                editedAt: new Date(),
              },
            }),
            this.prisma.application.updateMany({
              where: {
                interview: {
                  is: { id: payment.interviewId },
                },
              },
              data: { status: 'HIRED' },
            }),
          ]);

          await this.walletService.creditWalletAfterPayment(
            payment.candidateId,
            paidAmount,
            platformFee,
            `Salary received — order #${OrderIdentifier}`,
          );

          const employer = payment.interview?.application?.job?.employer;
          const jobSeeker = payment.interview?.application?.jobSeeker;
          const jobTitle = payment.interview?.application?.job?.title || 'your job';
          const employerName = employer?.companyName || employer?.fullName || 'Employer';
          const candidateName = jobSeeker?.fullName || 'Job seeker';

          await Promise.allSettled([
            employer?.user?.email
              ? this.notificationsService.createNotification(
                  employer.userId,
                  'Hire payment completed',
                  `${candidateName} has been hired for ${jobTitle}. Payment of JMD ${paidAmount.toLocaleString()} was completed successfully.`,
                  'PAYMENT_PAID',
                  employer.userId,
                )
              : Promise.resolve(),
            jobSeeker?.user?.email
              ? this.notificationsService.createNotification(
                  jobSeeker.userId,
                  'Salary credited to wallet',
                  `Your hire payment for ${jobTitle} was completed. JMD ${paidAmount.toLocaleString()} has been added to your wallet after a platform fee of JMD ${platformFee.toLocaleString()}.`,
                  'PAYMENT_CREDIT',
                  employer?.userId,
                )
              : Promise.resolve(),
          ]);

          return { redirect: `${frontendSuccess}?orderId=${OrderIdentifier}` };

        } else {
          await this.prisma.payment.update({
            where: { orderId: OrderIdentifier },
            data: { status: 'FAILED' },
          });
          return {
            redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=${payData.ResponseMessage || 'Payment declined'}`,
          };
        }
      } catch (err: any) {
        await this.prisma.payment.update({
          where: { orderId: OrderIdentifier },
          data: { status: 'FAILED' },
        });
        return {
          redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=Payment completion failed`,
        };
      }
    }

    // error
    await this.prisma.payment.update({
      where: { orderId: OrderIdentifier },
      data: { status: 'FAILED' },
    });
    return {
      redirect: `${frontendFailed}?orderId=${OrderIdentifier}&reason=${responseData.ResponseMessage || 'Payment failed'}`,
    };
  }

  async markHireCompleted(jobSeekerUserId: string, interviewId: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId: jobSeekerUserId },
      select: { id: true },
    });
    if (!jobSeekerProfile) throw new NotFoundException('Job seeker profile not found');

    const payment = await this.prisma.payment.findFirst({
      where: {
        interviewId,
        candidateId: jobSeekerProfile.id,
      },
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
                jobSeeker: {
                  include: {
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Hire payment not found');
    if (payment.status !== 'PAID') {
      throw new BadRequestException('Payment must be completed before marking this hire as completed');
    }
    if (payment.candidateCompletedAt) {
      return {
        success: true,
        message: 'Hire already marked as completed',
        completedAt: payment.candidateCompletedAt,
      };
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { candidateCompletedAt: new Date() },
      select: {
        candidateCompletedAt: true,
      },
    });

    const employerUserId = payment.interview?.application?.job?.employer?.userId;
    const employerEmail = payment.interview?.application?.job?.employer?.user?.email;
    const seekerName = payment.interview?.application?.jobSeeker?.fullName || 'Job seeker';
    const employerName =
      payment.interview?.application?.job?.employer?.companyName ||
      payment.interview?.application?.job?.employer?.fullName ||
      'Employer';
    const jobTitle = payment.interview?.application?.job?.title || 'your job';

    await Promise.allSettled([
      employerUserId
        ? this.firebaseService.createNotification(
            employerUserId,
            'Job seeker marked job as completed',
            `${seekerName} has marked ${jobTitle} as completed. Please review and confirm completion.`,
            'HIRE_COMPLETED',
            jobSeekerUserId,
          )
        : Promise.resolve(),
      employerEmail
        ? this.mailService.sendMail({
            to: employerEmail,
            subject: `Job marked completed - ${jobTitle}`,
            message: `Hello ${employerName},\n\n${seekerName} has marked ${jobTitle} as completed. Please review the job details and confirm completion in your dashboard.`,
          })
        : Promise.resolve(),
    ]);

    return {
      success: true,
      message: 'Hire marked as completed',
      completedAt: updated.candidateCompletedAt,
    };
  }

  async markEmployerHireCompleted(employerUserId: string, interviewId: string) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { userId: employerUserId },
      select: { id: true },
    });
    if (!employerProfile) throw new NotFoundException('Employer profile not found');

    const payment = await this.prisma.payment.findFirst({
      where: {
        interviewId,
        employerId: employerProfile.id,
      },
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
                jobSeeker: {
                  include: {
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Hire payment not found');
    if (payment.status !== 'PAID') {
      throw new BadRequestException('Payment must be completed before confirming completion');
    }
    if (!payment.candidateCompletedAt) {
      throw new BadRequestException('Job seeker must mark this hire as completed first');
    }
    if (payment.employerCompletedAt) {
      return {
        success: true,
        message: 'Hire already confirmed by employer',
        completedAt: payment.employerCompletedAt,
      };
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { employerCompletedAt: new Date() },
      select: {
        employerCompletedAt: true,
      },
    });

    const jobSeekerUserId = payment.interview?.application?.jobSeeker?.userId;
    const jobSeekerEmail = payment.interview?.application?.jobSeeker?.user?.email;
    const seekerName = payment.interview?.application?.jobSeeker?.fullName || 'Job seeker';
    const employerName =
      payment.interview?.application?.job?.employer?.companyName ||
      payment.interview?.application?.job?.employer?.fullName ||
      'Employer';
    const jobTitle = payment.interview?.application?.job?.title || 'your job';

    await Promise.allSettled([
      jobSeekerUserId
        ? this.firebaseService.createNotification(
            jobSeekerUserId,
            'Employer confirmed job completion',
            `${employerName} has confirmed completion for ${jobTitle}.`,
            'HIRE_COMPLETED',
            employerUserId,
          )
        : Promise.resolve(),
      jobSeekerEmail
        ? this.mailService.sendMail({
            to: jobSeekerEmail,
            subject: `Completion confirmed - ${jobTitle}`,
            message: `Hello ${seekerName},\n\n${employerName} has confirmed the completion of ${jobTitle}. Your completion has been reviewed successfully.`,
          })
        : Promise.resolve(),
    ]);

    return {
      success: true,
      message: 'Hire confirmed by employer',
      completedAt: updated.employerCompletedAt,
    };
  }
  // ─────────────────────────────────────────────
  // 3. PAYMENT STATUS CHECK
  // ─────────────────────────────────────────────
  async getPaymentStatus(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      select: {
        status: true,
        amount: true,
        platformFee: true,
        totalAmount: true,
        currency: true,
        paidAt: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { success: true, data: payment };
  }

  // ─────────────────────────────────────────────
  // 4. MY PAYMENTS (Employer)
  // ─────────────────────────────────────────────
  async getMyPayments(employerUserId: string) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { userId: employerUserId },
    });
    if (!employerProfile) throw new NotFoundException('Employer profile not found');

    const payments = await this.prisma.payment.findMany({
      where: { employerId: employerProfile.id },
      include: {
        candidate: { select: { fullName: true, profilePic: true } },
        interview: {
          include: {
            application: {
              include: { job: { select: { title: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: payments };
  }
}
