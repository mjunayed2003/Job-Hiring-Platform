
import { IsString, IsNotEmpty } from 'class-validator';

export class SaveTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}