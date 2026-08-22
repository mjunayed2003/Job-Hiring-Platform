import { IsNotEmpty, IsString, IsNumber, IsArray, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  duration!: number; // days

  @IsNotEmpty()
  @IsNumber()
  slotsAvailable!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  features!: string[];

  @IsOptional()
  @IsString()
  revenueCatProductId?: string;
}
