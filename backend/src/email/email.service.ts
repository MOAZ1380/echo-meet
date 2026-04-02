import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  /**
   * Sends an OTP email used for password reset.
   */
  async sendPasswordResetOtp(email: string, otp: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? 'no-reply@echo-meet.local';

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
