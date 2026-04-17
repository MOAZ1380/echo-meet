import { apiRequest, authHeaders } from "./client";
import type {
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
  VerifyResetOtpPayload,
  AuthResponse,
} from "../types/auth";

/**
 * Registers a new user account.
 */
export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Logs in an existing user and returns auth payload.
 */
export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Requests password reset and sends OTP to user email.
 */
export function requestPasswordReset(payload: RequestResetPayload) {
  return apiRequest<{ message: string; resetToken: string }>(
    "/auth/request-password-reset",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Verifies submitted OTP and returns a short-lived reset token.
 */
export function verifyPasswordResetOtp(
  token: string,
  payload: VerifyResetOtpPayload,
) {
  return apiRequest<{ message: string; resetToken: string }>(
    "/auth/verify-password-reset-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeaders(token),
    },
  );
}

/**
 * Resets user password using a valid reset token.
 */
export function resetPassword(token: string, payload: ResetPasswordPayload) {
  return apiRequest<{ message: string; resetToken: string }>(
    "/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeaders(token),
    },
  );
}
