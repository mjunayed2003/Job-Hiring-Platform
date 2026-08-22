import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  emailType?: 'custom' | 'interview_invitation';

  @IsString() @IsOptional() candidateName?: string;
  @IsString() @IsOptional() company?: string;
  @IsString() @IsOptional() position?: string;
  @IsString() @IsOptional() date?: string;
  @IsString() @IsOptional() time?: string;
  @IsString() @IsOptional() platform?: string;
  @IsString() @IsOptional() meetingLink?: string;
}