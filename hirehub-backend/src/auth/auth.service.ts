import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole, JobType } from '../generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { otpVerificationTemplate } from 'src/admin/admin-mail/mail.templates';
import { FirebaseService } from 'src/firebase/firebase.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ChangePasswordDto,
  JobSeekerBasicDto,
  JobSeekerEducationDto,
  JobSeekerProfessionalDto,
  EmployerBasicDto,
  CompanyBasicDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private readonly firebaseService: FirebaseService,
  ) { }

  // ─────────────────────────────────────────────────────
  // HELPER — Generate 6-digit OTP
  // ─────────────────────────────────────────────────────
  private generateOtp(): { otp: string; otpExpiry: null } {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return { otp, otpExpiry: null };
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Safe OTP comparison (timing-safe)
  // ─────────────────────────────────────────────────────
  private safeOtpCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Temp Token — developer/Postman flow
  // ─────────────────────────────────────────────────────
  private async generateTempToken(
    userId: string,
    email: string,
    role: string,
    tokenVersion: number,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, email, role, type: 'temp', tokenVersion },
      { expiresIn: '1d' },
    );
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Main Token (60 days) — full auth
  // ─────────────────────────────────────────────────────
  private async generateMainToken(
    userId: string,
    email: string,
    role: string,
    tokenVersion: number,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, email, role, type: 'main', tokenVersion },
      { expiresIn: '60d' },
    );
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Send OTP email (shared)
  // ─────────────────────────────────────────────────────
  private async sendOtpEmail(
    to: string,
    subject: string,
    heading: string,
    otp: string,
    name?: string,
  ) {
    try {
      await this.mailService.sendMail({
        to,
        subject,
        html: otpVerificationTemplate(name || 'User', heading, otp, 2),
      });
    } catch {
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Notify all admins once registration is complete
  // ─────────────────────────────────────────────────────
  private async notifyAdminsRegistrationComplete(params: {
    userId: string;
    role: UserRole;
    fullName: string;
  }) {
    const { userId, role, fullName } = params;
    const type = 'REGISTRATION_COMPLETE';
    const title = 'New registration ready for approval';
    const message = `${fullName} (${role}) has completed all required registration steps and is ready for admin approval.`;

    const alreadySent = await this.prisma.notification.count({
      where: {
        createdBy: userId,
        type,
      },
    });

    if (alreadySent > 0) {
      return;
    }

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    if (admins.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        createdBy: userId,
        type,
        title,
        message,
      })),
    });
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Core OTP validate (shared)
  // ─────────────────────────────────────────────────────
  private validateOtp(
    user: { otpCode: string | null },
    inputOtp: string,
  ) {
    if (!user.otpCode || !this.safeOtpCompare(user.otpCode, inputOtp)) {
      throw new BadRequestException('Invalid OTP');
    }
  }

  // ─────────────────────────────────────────────────────
  // HELPER — Check current signup progress by role
  // ─────────────────────────────────────────────────────
  private getMissingSignupStep(user: {
    role: UserRole;
    status: string;
    jobSeekerProfile?: {
      profilePic?: string | null;
      phone?: string | null;
      about?: string | null;
      location?: string | null;
      gender?: string | null;
      preferredJobCategories?: unknown[];
      employmentType?: unknown[];
      education?: unknown[];
      experienceLevel?: string | null;
      skills?: string[] | null;
      resumeUrl?: string | null;
      idCardFront?: string | null;
      idCardBack?: string | null;
      selfieImage?: string | null;
    } | null;
    employerProfile?: {
      idCardFront?: string | null;
      idCardBack?: string | null;
      selfieImage?: string | null;
      licenseFile?: string | null;
    } | null;
  }) {
    switch (user.role) {
      case UserRole.JOB_SEEKER:
        if (
          !user.jobSeekerProfile?.profilePic ||
          !user.jobSeekerProfile?.phone ||
          !user.jobSeekerProfile?.about ||
          !user.jobSeekerProfile?.location ||
          !user.jobSeekerProfile?.gender ||
          !user.jobSeekerProfile?.preferredJobCategories ||
          user.jobSeekerProfile.preferredJobCategories.length === 0 ||
          !user.jobSeekerProfile?.employmentType ||
          user.jobSeekerProfile.employmentType.length === 0
        ) {
          return '/auth/signup/job-seeker/step-3';
        }

        if (!user.jobSeekerProfile?.education || user.jobSeekerProfile.education.length === 0) {
          return '/auth/signup/job-seeker/step-4';
        }

        if (
          !user.jobSeekerProfile?.resumeUrl ||
          !user.jobSeekerProfile?.experienceLevel ||
          !user.jobSeekerProfile?.skills ||
          user.jobSeekerProfile.skills.length === 0
        ) {
          return '/auth/signup/job-seeker/step-5';
        }

        if (
          !user.jobSeekerProfile?.idCardFront ||
          !user.jobSeekerProfile?.idCardBack ||
          !user.jobSeekerProfile?.selfieImage
        ) {
          return '/auth/signup/job-seeker/step-6';
        }

        return null;
      case UserRole.EMPLOYER:
        if (
          !user.employerProfile?.idCardFront ||
          !user.employerProfile?.idCardBack ||
          !user.employerProfile?.selfieImage
        ) {
          return '/auth/signup/employer/step-4';
        }
        return null;
      case UserRole.COMPANY:
        if (!user.employerProfile?.licenseFile) {
          return '/auth/signup/company/step-4';
        }
        return null;
      default:
        return null;
    }
  }

  // ─────────────────────────────────────────────────────
  // 1. REGISTER -> Returns tempToken (developer) + saves email (frontend)
  // ─────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { otp, otpExpiry } = this.generateOtp();
    const role = dto.role as UserRole;

    let finalUser;

    if (existingUser) {
      if (existingUser.status !== 'PENDING') {
        throw new BadRequestException('Email already exists!');
      }

      const userId = existingUser.id;

      finalUser = await this.prisma.$transaction(async (tx) => {
        // delete previous profile data
        await tx.jobSeekerProfile.deleteMany({ where: { userId } });
        await tx.employerProfile.deleteMany({ where: { userId } });

        // user table update new profile
        return tx.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            role: role,
            isVerified: false,
            otpCode: otp,
            otpExpiry: otpExpiry,
            ...(role === UserRole.JOB_SEEKER && {
              jobSeekerProfile: { create: { fullName: dto.fullName } },
            }),
            ...((role === UserRole.EMPLOYER || role === UserRole.COMPANY) && {
              employerProfile: {
                create: {
                  fullName: dto.fullName,
                  companyName: dto.companyName || null,
                },
              },
            }),
          },
        });
      });
    } else {
      // new email
      finalUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role,
          status: 'PENDING',
          isVerified: false,
          otpCode: otp,
          otpExpiry,
          ...(role === UserRole.JOB_SEEKER && {
            jobSeekerProfile: { create: { fullName: dto.fullName } },
          }),
          ...((role === UserRole.EMPLOYER || role === UserRole.COMPANY) && {
            employerProfile: {
              create: {
                fullName: dto.fullName,
                companyName: dto.companyName || null,
              },
            },
          }),
        },
      });
    }

    //  OTP email send
    await this.sendOtpEmail(
      dto.email,
      'Verify Your Email - HireHubJA',
      'Welcome to HireHubJA!',
      otp,
      dto.fullName,
    );

    // tempToken
    const tempToken = await this.generateTempToken(
      finalUser.id,
      finalUser.email,
      finalUser.role,
      finalUser.tokenVersion,
    );

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      tempToken,
      role: finalUser.role,
    };
  }
  // ─────────────────────────────────────────────────────
  // 2a. VERIFY OTP — by userId (token flow — developer/Postman)
  // ─────────────────────────────────────────────────────
  async verifyOtp(userId: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    this.validateOtp(user, otp);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiry: null },
    });

    const tempToken = await this.generateTempToken(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    return {
      success: true,
      message: 'OTP verified successfully.',
      tempToken,
      role: user.role,
    };
  }

  // ─────────────────────────────────────────────────────
  // 2b. VERIFY OTP — by email (email flow — frontend)
  // ─────────────────────────────────────────────────────
  async verifyOtpByEmail(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    this.validateOtp(user, otp);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiry: null },
    });

    const tempToken = await this.generateTempToken(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    return {
      success: true,
      message: 'OTP verified successfully.',
      tempToken,
      role: user.role,
    };
  }

  // ─────────────────────────────────────────────────────
  // 3. RESEND OTP (Registration only)
  // ─────────────────────────────────────────────────────
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (user.status === 'BLOCKED' || user.status === 'REJECTED') {
      throw new ForbiddenException('Your account has been blocked or rejected.');
    }

    const { otp, otpExpiry } = this.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry },
    });

    await this.sendOtpEmail(user.email, 'New OTP - HireHubJA', 'New OTP Code', otp);
    const tempToken = await this.generateTempToken(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );

    return { success: true, message: 'OTP resent successfully.', tempToken };
  }

  // ─────────────────────────────────────────────────────
  // 4. JOB SEEKER — Basic Info
  // ─────────────────────────────────────────────────────
  async updateJobSeekerBasic(
    userId: string,
    dto: JobSeekerBasicDto,
    profilePicFile?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.JOB_SEEKER)
      throw new BadRequestException('Not a job seeker account');

    if (!profilePicFile) {
      throw new BadRequestException('Profile picture is required');
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('Phone number is required');
    }
    if (!dto.location?.trim()) {
      throw new BadRequestException('Location is required');
    }
    if (!dto.about?.trim()) {
      throw new BadRequestException('About yourself is required');
    }
    if (!dto.gender?.trim()) {
      throw new BadRequestException('Gender is required');
    }

    const categories =
      typeof dto.preferredJobCategoryIds === 'string'
        ? JSON.parse(dto.preferredJobCategoryIds)
        : dto.preferredJobCategoryIds || [];

    const employmentTypeRaw =
      typeof dto.employmentType === 'string'
        ? JSON.parse(dto.employmentType)
        : dto.employmentType || [];
        
    const employmentType = Array.isArray(employmentTypeRaw)
      ? (employmentTypeRaw.map((type: string) => 
          typeof type === 'string' ? type.toUpperCase().replace(/[-\s]+/g, '_') : type
        ) as JobType[])
      : [];

    if (!employmentType || employmentType.length === 0) {
      throw new BadRequestException('At least one employment type is required');
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      throw new BadRequestException('Please select at least one preferred job category');
    }

    if (!Array.isArray(employmentType) || employmentType.length === 0) {
      throw new BadRequestException('Please select at least one employment type');
    }

    const profilePic = `/uploads/${profilePicFile.filename}`;
    const dob =
      dto.dob && dto.dob.trim()
        ? new Date(dto.dob)
        : undefined;

    if (dob && Number.isNaN(dob.getTime())) {
      throw new BadRequestException('Date of birth is invalid');
    }

    try {
      await this.prisma.jobSeekerProfile.upsert({
        where: { userId },
        update: {
          phone: dto.phone,
          location: dto.location,
          about: dto.about,
          gender: dto.gender,
          ...(dob && { dob }),
          employmentType,
          ...(profilePic && { profilePic }),
          ...(categories.length > 0 && {
            preferredJobCategories: { set: categories.map((id: string) => ({ id })) },
          }),
        },
        create: {
          userId,
          fullName: user.jobSeekerProfile?.fullName || 'User',
          phone: dto.phone,
          location: dto.location,
          about: dto.about,
          gender: dto.gender,
          ...(dob && { dob }),
          employmentType,
          ...(profilePic && { profilePic }),
          ...(categories.length > 0 && {
            preferredJobCategories: { connect: categories.map((id: string) => ({ id })) },
          }),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new BadRequestException(
          'One or more Preferred Job Category IDs are invalid or do not exist.',
        );
      }
      throw error;
    }

    return { success: true, message: 'Basic info saved.' };
  }

  // ─────────────────────────────────────────────────────
  // 5. JOB SEEKER — Education
  // ─────────────────────────────────────────────────────
  async updateJobSeekerEducation(userId: string, dto: JobSeekerEducationDto) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const education =
      typeof dto.education === 'string' ? JSON.parse(dto.education) : dto.education || [];

    const normalizedEducation = Array.isArray(education)
      ? education.map((edu: any) => ({
          degreeName: `${edu?.degreeName ?? ''}`.trim(),
          institution: `${edu?.institution ?? ''}`.trim(),
          startDate: `${edu?.startDate ?? ''}`.trim(),
          completionYear: `${edu?.completionYear ?? ''}`.trim(),
          isCurrent: edu?.isCurrent || false,
        }))
      : [];

    if (normalizedEducation.length === 0) {
      throw new BadRequestException('Educational details are required');
    }

    const hasPartialEducation = normalizedEducation.some((edu: any) => {
      const anyFieldFilled = Boolean(
        edu.degreeName || edu.institution || edu.startDate || edu.completionYear || edu.isCurrent,
      );
      const completeWithCurrent = Boolean(
        edu.degreeName && edu.institution && edu.startDate && edu.isCurrent,
      );
      const completeWithCompletion = Boolean(
        edu.degreeName && edu.institution && edu.startDate && edu.completionYear && !edu.isCurrent,
      );
      return anyFieldFilled && !completeWithCurrent && !completeWithCompletion;
    });

    if (hasPartialEducation) {
      throw new BadRequestException(
        'Each education entry must include institution, degree name, start date, and either completion year or current study status.',
      );
    }

    await this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: {
        education: {
          deleteMany: {},
          create: normalizedEducation.map((edu: any) => ({
            degreeName: edu.degreeName,
            institution: edu.institution,
            startDate: new Date(edu.startDate),
            completionYear: edu.completionYear ? new Date(edu.completionYear) : null,
            isCurrent: edu.isCurrent || false,
          })),
        },
      },
    });

    return { success: true, message: 'Education saved.' };
  }

  // ─────────────────────────────────────────────────────
  // 6. JOB SEEKER — Professional
  // ─────────────────────────────────────────────────────
  async updateJobSeekerProfessional(userId: string, dto: JobSeekerProfessionalDto, files: any) {
    if (!files?.resume?.[0]) {
      throw new BadRequestException('Resume file is required');
    }

    if (!dto.experienceLevel?.trim()) {
      throw new BadRequestException('Experience level is required');
    }

    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const skills =
      typeof dto.skills === 'string' && dto.skills.trim() !== '' ? JSON.parse(dto.skills) : dto.skills || [];
    const experience =
      typeof dto.experience === 'string' && dto.experience.trim() !== '' ? JSON.parse(dto.experience) : dto.experience || [];
    const resumeUrl = `/uploads/${files.resume[0].filename}`;

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill: any) => `${skill ?? ''}`.trim()).filter(Boolean)
      : [];

    if (normalizedSkills.length === 0) {
      throw new BadRequestException('Please add at least one skill');
    }

    const normalizedExperience = Array.isArray(experience)
      ? experience.map((exp: any) => ({
          designation: `${exp?.designation ?? ''}`.trim(),
          companyName: `${exp?.companyName ?? ''}`.trim(),
          startDate: `${exp?.startDate ?? ''}`.trim(),
          endDate: `${exp?.endDate ?? ''}`.trim(),
          isCurrent: exp?.isCurrent || false,
          description: `${exp?.description ?? ''}`.trim(),
        }))
      : [];

    const hasPartialExperience = normalizedExperience.some((exp: any) => {
      const anyFieldFilled = Boolean(
        exp.designation || exp.companyName || exp.startDate || exp.endDate || exp.description,
      );
      const allFieldsFilled = Boolean(
        exp.designation && exp.companyName && exp.startDate && (exp.endDate || exp.isCurrent),
      );
      return anyFieldFilled && !allFieldsFilled;
    });

    if (hasPartialExperience) {
      throw new BadRequestException(
        'Each experience entry must include designation, company name, start date, and end date.',
      );
    }

    await this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: {
        experienceLevel: dto.experienceLevel,
        skills: normalizedSkills,
        resumeUrl,
        experience: {
          deleteMany: {},
          create: normalizedExperience.map((exp: any) => ({
            designation: exp.designation,
            companyName: exp.companyName,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent || false,
            description: exp.description,
          })),
        },
      },
    });

    return { success: true, message: 'Professional details saved.' };
  }

  // ─────────────────────────────────────────────────────
  // 7. JOB SEEKER — Verification
  // ─────────────────────────────────────────────────────
  async updateJobSeekerVerification(userId: string, files: any) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (!files?.idCardFront?.[0]) {
      throw new BadRequestException('ID card front is required');
    }
    if (!files?.idCardBack?.[0]) {
      throw new BadRequestException('ID card back is required');
    }
    if (!files?.selfieImage?.[0]) {
      throw new BadRequestException('Selfie image is required');
    }

    const idCardFront = `/uploads/${files.idCardFront[0].filename}`;
    const idCardBack = `/uploads/${files.idCardBack[0].filename}`;
    const selfieImage = `/uploads/${files.selfieImage[0].filename}`;

    await this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: {
        ...(idCardFront && { idCardFront }),
        ...(idCardBack && { idCardBack }),
        ...(selfieImage && { selfieImage }),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        jobSeekerProfile: { select: { fullName: true } },
      },
    });

    if (user?.role === UserRole.JOB_SEEKER) {
      await this.notifyAdminsRegistrationComplete({
        userId,
        role: user.role,
        fullName: user.jobSeekerProfile?.fullName ?? 'Job Seeker',
      });
    }

    return {
      success: true,
      message: 'Verification documents uploaded. Account pending approval.',
    };
  }

  // ─────────────────────────────────────────────────────
  // 8. EMPLOYER — Basic Info
  // ─────────────────────────────────────────────────────
  async updateEmployerBasic(
    userId: string,
    dto: EmployerBasicDto,
    profilePicFile?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.EMPLOYER) throw new BadRequestException('Not an employer account');

    if (!profilePicFile) {
      throw new BadRequestException('Profile picture is required');
    }

    const profilePic = `/uploads/${profilePicFile.filename}`;

    await this.prisma.employerProfile.upsert({
      where: { userId },
      update: {
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        profilePic,
      },
      create: {
        userId,
        fullName: user.employerProfile?.fullName || 'Employer',
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        profilePic,
      },
    });

    return { success: true, message: 'Basic info saved.' };
  }

  // ─────────────────────────────────────────────────────
  // 9. EMPLOYER — Verification
  // ─────────────────────────────────────────────────────
  async updateEmployerVerification(userId: string, files: any) {
    const profile = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (!files?.idCardFront?.[0]) {
      throw new BadRequestException('ID card front is required');
    }
    if (!files?.idCardBack?.[0]) {
      throw new BadRequestException('ID card back is required');
    }
    if (!files?.selfieImage?.[0]) {
      throw new BadRequestException('Selfie image is required');
    }

    const idCardFront = `/uploads/${files.idCardFront[0].filename}`;
    const idCardBack = `/uploads/${files.idCardBack[0].filename}`;
    const selfieImage = `/uploads/${files.selfieImage[0].filename}`;

    await this.prisma.employerProfile.update({
      where: { userId },
      data: {
        idCardFront,
        idCardBack,
        selfieImage,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        employerProfile: { select: { fullName: true, companyName: true } },
      },
    });

    if (user?.role === UserRole.EMPLOYER) {
      await this.notifyAdminsRegistrationComplete({
        userId,
        role: user.role,
        fullName: user.employerProfile?.fullName ?? 'Employer',
      });
    }

    return {
      success: true,
      message: 'Verification documents uploaded. Account pending approval.',
    };
  }

  // ─────────────────────────────────────────────────────
  // 10. COMPANY — Basic Info
  // ─────────────────────────────────────────────────────
  async updateCompanyBasic(
    userId: string,
    dto: CompanyBasicDto,
    profilePicFile?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.COMPANY) throw new BadRequestException('Not a company account');

    if (!profilePicFile) {
      throw new BadRequestException('Profile picture is required');
    }

    const profilePic = `/uploads/${profilePicFile.filename}`;

    await this.prisma.employerProfile.upsert({
      where: { userId },
      update: {
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        businessRegCertId: dto.businessRegCertId,
        taxId: dto.taxId,
        authorizedRepId: dto.authorizedRepId,
        profilePic,
      },
      create: {
        userId,
        fullName: user.employerProfile?.fullName || 'Company Name',
        companyName: user.employerProfile?.companyName || 'Company Name',
        phone: dto.phone,
        location: dto.location,
        about: dto.about,
        businessRegCertId: dto.businessRegCertId,
        taxId: dto.taxId,
        authorizedRepId: dto.authorizedRepId,
        profilePic,
      },
    });

    return { success: true, message: 'Company info saved.' };
  }

  // ─────────────────────────────────────────────────────
  // 11. COMPANY — Verification
  // ─────────────────────────────────────────────────────
  async updateCompanyVerification(userId: string, files: any) {
    const profile = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (!files?.licenseFile?.[0]) {
      throw new BadRequestException('License file is required');
    }

    const licenseFile = `/uploads/${files.licenseFile[0].filename}`;

    await this.prisma.employerProfile.update({
      where: { userId },
      data: { licenseFile },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        employerProfile: { select: { fullName: true, companyName: true } },
      },
    });

    if (user?.role === UserRole.COMPANY) {
      await this.notifyAdminsRegistrationComplete({
        userId,
        role: user.role,
        fullName: user.employerProfile?.companyName ?? user.employerProfile?.fullName ?? 'Company',
      });
    }

    return {
      success: true,
      message: 'Business certificate uploaded. Account pending approval.',
    };
  }

  // ─────────────────────────────────────────────────────
  // 12. LOGIN
  // ─────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        jobSeekerProfile: {
          include: {
            education: true,
            preferredJobCategories: true,
          },
        },
        employerProfile: true,
        adminProfile: true,
      },
    });

    if (!user) throw new NotFoundException('No account found with this email. Please register first.');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

    // only login 3 role
    const allowedRoles: UserRole[] = [UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.COMPANY];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied. This login is not available for your account type.');
    }

    if (user.status === 'BLOCKED' || user.status === 'REJECTED')
      throw new ForbiddenException('Your account has been blocked or rejected.');

    const nextStep = this.getMissingSignupStep(user);

    if (nextStep) {
      const tempToken = await this.generateTempToken(
        user.id,
        user.email,
        user.role,
        user.tokenVersion,
      );
      return {
        success: false,
        message: 'Please continue your registration process.',
        needsVerification: true,
        tempToken,
        nextStep,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          fullName:
            user.role === UserRole.JOB_SEEKER
              ? user.jobSeekerProfile?.fullName ?? ''
              : user.employerProfile?.fullName ?? '',
        },
      };
    }

    if (user.status === 'PENDING') {
      throw new ForbiddenException('Please wait for admin approval.');
    }

    const token = await this.generateMainToken(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );

    if (dto.fcmToken?.trim()) {
      try {
        await this.firebaseService.saveToken(user.id, dto.fcmToken.trim());
      } catch (error) {
        console.warn('Failed to save FCM token during login:', error);
      }
    }

    let fullName = '';
    let profilePic: string | null = null;
    let experienceLevel: string | null = null;
    let location: string | null = null;
    let idVerification: { idCardFront: boolean; idCardBack: boolean } | null = null;
    let selfieVerification: boolean | null = null;
    let licenseFile: boolean | null = null;

    if (user.role === UserRole.JOB_SEEKER && user.jobSeekerProfile) {
      fullName = user.jobSeekerProfile.fullName;
      profilePic = user.jobSeekerProfile.profilePic;
      experienceLevel = user.jobSeekerProfile.experienceLevel;
      location = user.jobSeekerProfile.location;
      idVerification = {
        idCardFront: !!user.jobSeekerProfile.idCardFront,
        idCardBack: !!user.jobSeekerProfile.idCardBack,
      };
      selfieVerification = !!user.jobSeekerProfile.selfieImage;
    } else if (
      (user.role === UserRole.EMPLOYER || user.role === UserRole.COMPANY) &&
      user.employerProfile
    ) {
      fullName = user.employerProfile.fullName;
      profilePic = user.employerProfile.profilePic;
      location = user.employerProfile.location;
      idVerification = {
        idCardFront: !!user.employerProfile.idCardFront,
        idCardBack: !!user.employerProfile.idCardBack,
      };
      selfieVerification = !!user.employerProfile.selfieImage;
      if (user.role === UserRole.COMPANY) {
        licenseFile = !!user.employerProfile.licenseFile;
      }
    } else if (user.role === UserRole.ADMIN && user.adminProfile) {
      fullName = user.adminProfile.fullName;
      profilePic = user.adminProfile.profilePic;
    }

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName,
        profilePic,
        ...(experienceLevel && { experienceLevel }),
        ...(location && { location }),
        ...(idVerification && { idVerification }),
        ...(selfieVerification !== null && { selfieVerification }),
        ...(licenseFile !== null && { licenseFile }),
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // 13. LOGOUT — tokenVersion increment session invalidate
  // Prisma schema : tokenVersion Int @default(0)
  // ─────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────────────────
  // 13a. DELETE ACCOUNT — shared for all authenticated users
  // ─────────────────────────────────────────────────────
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { userId } });
      await tx.report.deleteMany({ where: { reporterId: userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.conversationParticipant.deleteMany({ where: { userId } });
      await tx.userDeviceToken.deleteMany({ where: { userId } });

      if (user.jobSeekerProfile) {
        const jobSeekerId = user.jobSeekerProfile.id;
        const applications = await tx.application.findMany({
          where: { jobSeekerId },
          select: { id: true },
        });
        const applicationIds = applications.map((application) => application.id);
        const interviews = applicationIds.length
          ? await tx.interview.findMany({
            where: { applicationId: { in: applicationIds } },
            select: { id: true },
          })
          : [];
        const interviewIds = interviews.map((interview) => interview.id);

        if (interviewIds.length) {
          await tx.payment.deleteMany({ where: { interviewId: { in: interviewIds } } });
        }

        await tx.payment.deleteMany({ where: { candidateId: jobSeekerId } });
        await tx.interview.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.application.deleteMany({ where: { jobSeekerId } });
        await tx.savedJob.deleteMany({ where: { jobSeekerId } });
        await tx.jobSeekerProfile.delete({ where: { id: jobSeekerId } });
      }

      if (user.employerProfile) {
        const employerId = user.employerProfile.id;
        const jobs = await tx.job.findMany({
          where: { employerId },
          select: { id: true },
        });
        const jobIds = jobs.map((job) => job.id);
        const applications = jobIds.length
          ? await tx.application.findMany({
            where: { jobId: { in: jobIds } },
            select: { id: true },
          })
          : [];
        const applicationIds = applications.map((application) => application.id);
        const interviews = applicationIds.length
          ? await tx.interview.findMany({
            where: { applicationId: { in: applicationIds } },
            select: { id: true },
          })
          : [];
        const interviewIds = interviews.map((interview) => interview.id);

        await tx.subscriptionPayment.deleteMany({ where: { employerId } });
        await tx.employerSubscription.deleteMany({ where: { employerId } });

        if (jobIds.length) {
          await tx.report.deleteMany({ where: { jobId: { in: jobIds } } });
          await tx.savedJob.deleteMany({ where: { jobId: { in: jobIds } } });
        }

        if (interviewIds.length) {
          await tx.payment.deleteMany({ where: { interviewId: { in: interviewIds } } });
        }

        await tx.payment.deleteMany({ where: { employerId } });
        await tx.interview.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.application.deleteMany({ where: { jobId: { in: jobIds } } });
        await tx.job.deleteMany({ where: { employerId } });
        await tx.employerProfile.delete({ where: { id: employerId } });
      }

      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true, message: 'Account deleted successfully' };
  }

  // ─────────────────────────────────────────────────────
  // 14a. CHANGE PASSWORD — shared for all logged-in roles
  // ─────────────────────────────────────────────────────
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
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
      },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────
  // 14b. FORGOT PASSWORD -> Returns tempToken
  // ─────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email first before resetting password.');
    }

    const { otp, otpExpiry } = this.generateOtp();

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { otpCode: otp, otpExpiry },
    });

    await this.sendOtpEmail(
      user.email,
      'Password Reset OTP - HireHubJA',
      'Password Reset',
      otp,
    );

    const tempToken = await this.generateTempToken(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );

    return {
      success: true,
      message: 'OTP sent to your email.',
      tempToken,
    };
  }

  // ─────────────────────────────────────────────────────
  // 17. RESET PASSWORD — by Token (OTP already verified)
  // Body: { newPassword }
  // Header: Authorization: Bearer {tempToken}
  // ─────────────────────────────────────────────────────
  async resetPasswordByToken(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiry: null,
        tokenVersion: { increment: 1 },
      },
    });

    return { success: true, message: 'Password reset successfully. You can now login.' };
  }
}
