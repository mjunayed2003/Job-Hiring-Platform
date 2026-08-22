import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  interviewId!: string;
}