import { apiRequest } from "./client";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
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

export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<AuthResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
