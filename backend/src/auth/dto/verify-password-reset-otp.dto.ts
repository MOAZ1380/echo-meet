import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyPasswordResetOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}
