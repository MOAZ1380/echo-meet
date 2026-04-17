export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type GoogleLoginPayload = {
  credential: string;
};

export type RequestResetPayload = {
  email: string;
};

export type VerifyResetOtpPayload = {
  otp: string;
};

export type ResetPasswordPayload = {
  newPassword: string;
};
