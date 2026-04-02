import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
   * Verifies the OTP and updates the user password.
   */
  @Post('reset-password')
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }
}
