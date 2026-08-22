// src/support/dto/create-support.dto.ts

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateSupportDto {
  @IsNotEmpty()
  @IsString()
  title?: string;

  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  message?: string;
}