import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordResetOtpDto } from './dto/verify-password-reset-otp.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Extracts and validates Google profile data from an ID token.
   */
  private async verifyGoogleCredential(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new BadRequestException('Google login is not configured');
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const profile = (await response.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      sub?: string;
    };

    if (profile.aud !== clientId) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const emailVerified =
      profile.email_verified === true || profile.email_verified === 'true';

    if (!profile.email || !emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      email: profile.email,
      name: profile.name?.trim() || profile.email.split('@')[0],
      googleId: profile.sub ?? '',
    };
  }

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
   * Creates a short-lived token that authorizes the password reset action.
   */
  private createPasswordResetToken(user: { id: string; email: string }) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        purpose: 'password-reset',
      },
      { expiresIn: '10m' },
    );
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
   * Logs in or creates a user using a verified Google ID token.
   */
  async googleLogin(data: GoogleLoginDto) {
    const googleProfile = await this.verifyGoogleCredential(data.credential);

    const existingUser = await this.userService.findByEmail(
      googleProfile.email,
    );

    if (existingUser) {
      return this.buildAuthResponse(
        existingUser as { id: string; email: string; name?: string | null },
      );
    }

    const randomPassword = randomBytes(32).toString('hex');
    const createdUser = await this.userService.create({
      email: googleProfile.email,
      name: googleProfile.name,
      password: randomPassword,
    });

    return this.buildAuthResponse(
      createdUser as { id: string; email: string; name?: string | null },
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

    // generate token for 10 minutes of validity to allow OTP verification without email access after OTP generation
    const resetToken = this.createPasswordResetToken({
      id: user.id,
      email: user.email,
    });

    return {
      message: 'Reset OTP sent to your email',
      expiresAt: resetOtpExpiresAt,
      resetToken,
    };
  }

  /**
   * Verifies the reset OTP and returns a temporary reset token.
   */
  async verifyPasswordResetOtp(
    userId: string,
    data: VerifyPasswordResetOtpDto,
  ) {
    // email from token
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

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

    return {
      message: 'OTP verified',
      resetToken: this.createPasswordResetToken({
        id: user.id,
        email: user.email,
      }),
    };
  }

  /**
   * Resets password using a verified reset token.
   */
  async resetPassword(userId: string, data: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.userService.updatePassword(user.id, data.newPassword);
    await this.userService.clearResetOtp(user.id);

    return { message: 'Password reset successful' };
  }
}
