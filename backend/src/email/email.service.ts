import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Sends an OTP email used for password reset.
   */
  async sendPasswordResetOtp(email: string, otp: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from =
      this.configService.get<string>('SMTP_FROM') ?? 'no-reply@echo-meet.local';

    const transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: user && pass ? { user, pass } : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });

    const expiresInMinutes = 10;

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Echo Meet Password Reset OTP',
        text: `Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in ${expiresInMinutes} minutes.</p>`,
      });
    } catch {
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }
}
