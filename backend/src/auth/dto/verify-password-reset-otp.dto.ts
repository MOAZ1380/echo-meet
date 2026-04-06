import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyPasswordResetOtpDto {
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}
