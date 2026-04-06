import { apiRequest } from "./client";
import type {
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
  VerifyResetOtpPayload,
  AuthResponse,
} from "../types/auth";

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(payload: RequestResetPayload) {
  return apiRequest<{ message: string }>("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyPasswordResetOtp(payload: VerifyResetOtpPayload) {
  return apiRequest<{ message: string; resetToken: string }>(
    "/auth/verify-password-reset-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
