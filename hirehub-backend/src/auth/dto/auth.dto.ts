import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty() @IsString() fullName!: string;
  @IsNotEmpty() @IsEmail() email!: string;
  @IsNotEmpty() @IsString() @MinLength(6) password!: string;
  @IsNotEmpty() @IsEnum(['JOB_SEEKER', 'EMPLOYER', 'COMPANY']) role!: string;
  @IsOptional() @IsString() companyName?: string;
}

export class LoginDto {
  @IsNotEmpty() @IsEmail() email!: string;
  @IsNotEmpty() @IsString() password!: string;
  @IsOptional() @IsString() fcmToken?: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty() @IsEmail() email!: string;
}

export class ChangePasswordDto {
  @IsNotEmpty() @IsString() currentPassword!: string;
  @IsNotEmpty() @IsString() @MinLength(6) newPassword!: string;
  @IsNotEmpty() @IsString() confirmPassword!: string;
}

export class JobSeekerBasicDto {
  @IsNotEmpty() @IsString() phone!: string;
  @IsNotEmpty() @IsString() location!: string;
  @IsNotEmpty() @IsString() about!: string;
  @IsNotEmpty() @IsString() gender!: string;
  @IsOptional() @IsString() dob?: string;
  @IsNotEmpty() @IsString() preferredJobCategoryIds!: string;
  @IsNotEmpty() @IsString() employmentType!: string;
}

export class JobSeekerEducationDto {
  @IsOptional()
    @IsArray()
    education?: any[]; 
}

export class JobSeekerProfessionalDto {
  @IsNotEmpty() @IsString() experienceLevel!: string;
  @IsNotEmpty() @IsString() skills!: string;
  @IsOptional() @IsString() experience?: string;
}

export class EmployerBasicDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() about?: string;
}

export class CompanyBasicDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() about?: string;
  @IsOptional() @IsString() businessRegCertId?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() authorizedRepId?: string;
}
