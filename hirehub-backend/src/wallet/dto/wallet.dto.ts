import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class WithdrawRequestDto {
  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  accountHolderName!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  branch!: string;

  @IsString()
  @IsNotEmpty()
  accountType!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  accountNumber!: string;
}

export class AdminWithdrawActionDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsNotEmpty({ message: 'Admin note is required' })
  adminNote!: string;
}
