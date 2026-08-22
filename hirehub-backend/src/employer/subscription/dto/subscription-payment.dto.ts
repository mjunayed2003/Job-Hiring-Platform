import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;
}