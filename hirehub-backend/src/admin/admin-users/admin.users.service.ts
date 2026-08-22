import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '../../generated/prisma/client';
import { UsersQueryDto } from './dto/users-query.dto';
import { MailService } from '../admin-mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  private getPendingApprovalFilter(role?: UserRole) {
    if (role === UserRole.JOB_SEEKER) {
      return { status: UserStatus.PENDING, role, ...this.getJobSeekerCompletionFilter() };
    }

    if (role === UserRole.EMPLOYER) {
      return { status: UserStatus.PENDING, role, ...this.getEmployerCompletionFilter() };
    }

    if (role === UserRole.COMPANY) {
      return { status: UserStatus.PENDING, role, ...this.getCompanyCompletionFilter() };
    }

    return {
      status: UserStatus.PENDING,
      OR: [
        { role: UserRole.JOB_SEEKER, ...this.getJobSeekerCompletionFilter() },
        { role: UserRole.EMPLOYER, ...this.getEmployerCompletionFilter() },
        { role: UserRole.COMPANY, ...this.getCompanyCompletionFilter() },
      ],
    };
  }

  private getBaseUrl() {
    return (
      this.configService.get<string>('WEB_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173'
    ).replace(/\/$/, '');
  }

  private async generateVerificationBackupToken(userId: string, email: string, role: UserRole) {
    return this.jwtService.signAsync(
      { sub: userId, email, role, type: 'verification-backup' },
      { expiresIn: '6h' },
    );
  }

  private getVerificationBackupPath(role: UserRole) {
    if (role === UserRole.JOB_SEEKER) return '/auth/signup/job-seeker/step-6';
    if (role === UserRole.EMPLOYER) return '/auth/signup/employer/step-4';
    if (role === UserRole.COMPANY) return '/auth/signup/company/step-4';
    return null;
  }

  private getVerificationBackupFullName(user: any) {
    if (user.role === UserRole.JOB_SEEKER) {
      return user.jobSeekerProfile?.fullName ?? 'User';
    }

    if (user.role === UserRole.COMPANY) {
      return user.employerProfile?.companyName ?? user.employerProfile?.fullName ?? 'User';
    }

    return user.employerProfile?.fullName ?? 'User';
  }

  private buildVerificationBackupFields(role: UserRole, files: any) {
    const data: Record<string, string> = {};

    if (role === UserRole.COMPANY) {
      if (files?.licenseFile?.[0]) {
        data.licenseFile = `/uploads/${files.licenseFile[0].filename}`;
      }
      if (!data.licenseFile) {
        throw new BadRequestException('License file is required');
      }
      return data;
    }

    if (files?.idCardFront?.[0]) {
      data.idCardFront = `/uploads/${files.idCardFront[0].filename}`;
    }
    if (files?.idCardBack?.[0]) {
      data.idCardBack = `/uploads/${files.idCardBack[0].filename}`;
    }
    if (files?.selfieImage?.[0]) {
      data.selfieImage = `/uploads/${files.selfieImage[0].filename}`;
    }

    if (!data.idCardFront || !data.idCardBack) {
      throw new BadRequestException('Government ID front and back are required');
    }

    return data;
  }

  // ─────────────────────────────────────────────────────
  // GET ALL USERS — filter + pagination
  // ─────────────────────────────────────────────────────
  async getUsers(query: UsersQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const role = query.role ? (query.role as UserRole) : undefined;
    const status = query.status ? (query.status as UserStatus) : undefined;

    const where: any = {
      role: role ?? { in: [UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.COMPANY] },
    };

    if (status) {
      where.status = status;
      if (status === UserStatus.PENDING) {
        Object.assign(where, this.getPendingApprovalFilter(role));
      }
    }

    // Search by name or email
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        {
          jobSeekerProfile: {
            fullName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          employerProfile: {
            fullName: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          jobSeekerProfile: {
            select: {
              fullName: true,
              profilePic: true,
              phone: true,
              location: true,
              preferredJobCategories: { select: { name: true } },
            },
          },
          employerProfile: {
            select: {
              fullName: true,
              companyName: true,
              profilePic: true,
              phone: true,
              location: true,
            },
          },
        },
      }),
    ]);

    const formatted = users.map((u) => {
      const profile = u.jobSeekerProfile || u.employerProfile;
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        fullName: profile?.fullName ?? 'N/A',
        companyName: u.employerProfile?.companyName ?? null,
        profilePic: profile?.profilePic ?? null,
        phone: profile?.phone ?? null,
        location: profile?.location ?? null,
        categories:
          u.jobSeekerProfile?.preferredJobCategories.map((c) => c.name) ?? [],
      };
    });

    return {
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // GET USER BY ID — full details + documents
  // ─────────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        jobSeekerProfile: {
          select: {
            fullName: true,
            phone: true,
            gender: true,
            profilePic: true,
            location: true,
            about: true,
            skills: true,
            experienceLevel: true,
            resumeUrl: true,
            idCardFront: true,
            idCardBack: true,
            selfieImage: true,
            preferredJobCategories: { select: { id: true, name: true, image: true } },
            education: true,
            experience: true,
          },
        },
        employerProfile: {
          select: {
            fullName: true,
            companyName: true,
            phone: true,
            profilePic: true,
            location: true,
            about: true,
            website: true,
            idCardFront: true,
            idCardBack: true,
            selfieImage: true,
            licenseFile: true,
            businessRegCertId: true,
            taxId: true,
            authorizedRepId: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    let subscription: any = null;
    if (user.role === UserRole.COMPANY) {
      const companyProfile = await this.prisma.employerProfile.findUnique({
        where: { userId: id },
        select: {
          subscription: {
              select: {
                id: true,
                employerId: true,
                planId: true,
                slotsOverride: true,
                startDate: true,
                expiryDate: true,
                isActive: true,
                createdAt: true,
                plan: {
                  select: {
                    id: true,
                    name: true,
                  price: true,
                  duration: true,
                  slotsAvailable: true,
                  features: true,
                },
              },
            },
          },
        },
      });

      subscription = companyProfile?.subscription ?? null;
    }

    return {
      success: true,
      data: {
        ...user,
        employerProfile: user.employerProfile
          ? { ...user.employerProfile, subscription }
          : user.employerProfile,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // APPROVE USER
  // ─────────────────────────────────────────────────────
  async approveUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: {
          include: {
            education: true,
            preferredJobCategories: true,
          },
        },
        employerProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    const isJobSeekerReady =
      user.role === UserRole.JOB_SEEKER &&
      !!user.jobSeekerProfile?.profilePic &&
      !!user.jobSeekerProfile?.phone &&
      !!user.jobSeekerProfile?.about &&
      !!user.jobSeekerProfile?.location &&
      !!user.jobSeekerProfile?.gender &&
      (user.jobSeekerProfile?.employmentType?.length ?? 0) > 0 &&
      !!user.jobSeekerProfile?.resumeUrl &&
      !!user.jobSeekerProfile?.experienceLevel &&
      (user.jobSeekerProfile?.skills?.length ?? 0) > 0 &&
      (user.jobSeekerProfile?.preferredJobCategories?.length ?? 0) > 0 &&
      (user.jobSeekerProfile?.education?.length ?? 0) > 0 &&
      !!user.jobSeekerProfile?.idCardFront &&
      !!user.jobSeekerProfile?.idCardBack &&
      !!user.jobSeekerProfile?.selfieImage;

    const isEmployerReady =
      user.role === UserRole.EMPLOYER &&
      !!user.employerProfile?.profilePic &&
      !!user.employerProfile?.phone &&
      !!user.employerProfile?.about &&
      !!user.employerProfile?.location &&
      !!user.employerProfile?.idCardFront &&
      !!user.employerProfile?.idCardBack &&
      !!user.employerProfile?.selfieImage;

    const isCompanyReady =
      user.role === UserRole.COMPANY &&
      !!user.employerProfile?.profilePic &&
      !!user.employerProfile?.phone &&
      !!user.employerProfile?.about &&
      !!user.employerProfile?.location &&
      !!user.employerProfile?.licenseFile;

    if (
      (user.role === UserRole.JOB_SEEKER && !isJobSeekerReady) ||
      (user.role === UserRole.EMPLOYER && !isEmployerReady) ||
      (user.role === UserRole.COMPANY && !isCompanyReady)
    ) {
      throw new BadRequestException('User must complete all required signup steps before approval');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        rejectionReason: null,
      },
    });

    const displayName =
      user.role === UserRole.JOB_SEEKER
        ? user.jobSeekerProfile?.fullName ?? 'User'
        : user.role === UserRole.COMPANY
          ? user.employerProfile?.companyName ?? user.employerProfile?.fullName ?? 'User'
          : user.employerProfile?.fullName ?? 'User';

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'ACCOUNT_APPROVED',
        title: 'Account approved',
        message: 'Your account has been approved by the HireHub JA administration team.',
      },
    });

    try {
      await this.mailService.sendAccountApprovedMail(user.email, displayName);
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }

    return { success: true, message: 'User approved successfully' };
  }

  // ─────────────────────────────────────────────────────
  // EMERGENCY VERIFICATION BACKUP
  // ─────────────────────────────────────────────────────
  async sendVerificationBackupLink(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const backupPath = this.getVerificationBackupPath(user.role);
    if (!backupPath) {
      throw new BadRequestException('Emergency verification backup is only available for job seekers and employers');
    }

    const fullName = this.getVerificationBackupFullName(user);
    const token = await this.generateVerificationBackupToken(user.id, user.email, user.role);
    const uploadLink = `${this.getBaseUrl()}${backupPath}?backupToken=${encodeURIComponent(token)}`;

    await this.mailService.sendEmergencyVerificationBackupMail(
      user.email,
      fullName,
      uploadLink,
      user.role === UserRole.JOB_SEEKER
        ? 'job seeker'
        : user.role === UserRole.COMPANY
          ? 'company'
          : 'employer',
    );

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'EMERGENCY_VERIFICATION_BACKUP',
        title: 'Emergency verification upload link sent',
        message: 'An emergency verification upload link has been sent to the user email address.',
      },
    });

    return { success: true, message: 'Emergency verification backup email sent successfully' };
  }

  async uploadVerificationBackup(id: string, files: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const backupData = this.buildVerificationBackupFields(user.role, files);

    if (user.role === UserRole.JOB_SEEKER) {
      await this.prisma.jobSeekerProfile.update({
        where: { userId: id },
        data: backupData,
      });
    } else if (user.role === UserRole.EMPLOYER) {
      await this.prisma.employerProfile.update({
        where: { userId: id },
        data: backupData,
      });
    } else if (user.role === UserRole.COMPANY) {
      await this.prisma.employerProfile.update({
        where: { userId: id },
        data: backupData,
      });
    } else {
      throw new BadRequestException('Emergency verification backup upload is only available for job seekers, employers, and companies');
    }

    return { success: true, message: 'Emergency verification documents uploaded successfully' };
  }

  // ─────────────────────────────────────────────────────
  // REJECT USER
  // ─────────────────────────────────────────────────────
  async rejectUser(id: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.REJECTED,
        rejectionReason: reason ?? null,
      },
    });

    return { success: true, message: 'User rejected successfully' };
  }

  // ─────────────────────────────────────────────────────
  // BLOCK USER
  // ─────────────────────────────────────────────────────
  async blockUser(id: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot block an admin user');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.BLOCKED,
        rejectionReason: reason ?? null,
      },
    });

    return { success: true, message: 'User blocked successfully' };
  }



  // ─────────────────────────────────────────────────────
  // MOVE USER TO PENDING (Unblock)
  // ─────────────────────────────────────────────────────
  async pendingUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot modify an admin user status');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.PENDING,
        rejectionReason: null,
      },
    });

    return { success: true, message: 'User unblocked and moved to Pending successfully' };
  }

  // ─────────────────────────────────────────────────────
  // DELETE USER
  // ─────────────────────────────────────────────────────
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete an admin user from this endpoint');
    }

    await this.prisma.user.delete({ where: { id } });

    return { success: true, message: 'User deleted successfully' };
  }
}
