import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Builds a signed JWT for the given user identity.
   */
  private createToken(user: { id: string; email: string }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  /**
   * Normalizes the auth response shape returned by all auth endpoints.
   */
  private buildAuthResponse(user: {
    id: string;
    email: string;
    name?: string | null;
  }) {
    return {
      user,
      accessToken: this.createToken(user),
    };
  }

  /**
   * Creates a new user account and returns a token for immediate login.
   */
  async register(data: RegisterDto) {
    const user = await this.userService.create(data);
    return this.buildAuthResponse(
      user as { id: string; email: string; name?: string | null },
    );
  }

  /**
   * Validates credentials and returns a JWT on success.
   */
  async login(data: LoginDto) {
    const user = await this.userService.findByEmailWithPassword(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser = await this.userService.findByEmail(user.email);

    if (!safeUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(
      safeUser as { id: string; email: string; name?: string | null },
    );
  }

  /**
   * Creates a one-time OTP for password reset and stores its hash.
   */
  async requestPasswordReset(data: RequestPasswordResetDto) {
    const user = await this.userService.findByEmailWithPassword(data.email);

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    const otp = String(randomInt(100000, 1000000));
    const resetOtpHash = await bcrypt.hash(otp, 10);
    const resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userService.setResetOtp(
      user.id,
      resetOtpHash,
      resetOtpExpiresAt,
    );

    await this.emailService.sendPasswordResetOtp(user.email, otp);

    return {
      message: 'Reset OTP sent to your email',
      expiresAt: resetOtpExpiresAt,
    };
  }

  /**
   * Verifies the reset OTP and updates the password.
   */
  async resetPassword(data: ResetPasswordDto) {
    const user = await this.userService.findByEmailWithPassword(data.email);

    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const otpMatches = await bcrypt.compare(data.otp, user.resetOtpHash);

    if (!otpMatches) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const updatedUser = await this.userService.updatePassword(
      user.id,
      data.newPassword,
    );
    await this.userService.clearResetOtp(user.id);

    return this.buildAuthResponse(
      updatedUser as { id: string; email: string; name?: string | null },
    );
  }
}
