import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordResetOtpDto } from './dto/verify-password-reset-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new account and returns an auth response.
   */
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  /**
   * Authenticates a user and returns a JWT access token.
   */
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  /**
   * Generates a password-reset OTP for the given email.
   */
  @Post('request-password-reset')
  requestPasswordReset(@Body() data: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(data);
  }

  /**
   * Verifies OTP and returns a short-lived reset token.
   */
  @Post('verify-password-reset-otp')
  @UseGuards(JwtAuthGuard)
  verifyPasswordResetOtp(@Req() req, @Body() data: VerifyPasswordResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(req.userId, data);
  }

  /**
   * Resets password using a previously verified reset token.
   */
  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  resetPassword(@Req() req, @Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(req.userId, data);
  }
}
