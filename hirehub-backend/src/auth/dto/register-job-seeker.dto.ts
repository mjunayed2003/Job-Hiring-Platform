import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class RegisterJobSeekerDto {
  // --- User Credentials ---
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;

  // --- Basic Profile Info ---
  @IsNotEmpty()
  fullName!: string;

  @IsNotEmpty()
  phone!: string;

  @IsNotEmpty()
  about!: string;

  @IsNotEmpty()
  location!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['Entry', 'Mid', 'Senior'])
  experienceLevel!: string;

  // --- Arrays 
  @IsOptional()
  skills?: string; // e.g. '["Java", "Python"]'

  @IsOptional()
  @IsArray()
  education?: any[];

  @IsOptional()
  experience?: string; // e.g. '[{"companyName": "ABC", ...}]'

  @IsOptional()
  preferredJobCategoryIds?: string; // e.g. '["id1", "id2"]'
}