import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginApi,
  register as registerApi,
  requestPasswordReset as requestPasswordResetApi,
  resetPassword as resetPasswordApi,
  verifyPasswordResetOtp as verifyPasswordResetOtpApi,
} from "../api/authApi";
import {
  deleteCookie,
  getCookie,
  getJsonCookie,
  setCookie,
  setJsonCookie,
} from "../utils/cookies";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
  VerifyResetOtpPayload,
} from "../types/auth";

type AuthContextValue = {
  token: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  requestPasswordReset: (payload: RequestResetPayload) => Promise<string>;
  verifyPasswordResetOtp: (
    token: string,
    payload: VerifyResetOtpPayload,
  ) => Promise<string>;
  resetPassword: (
    token: string,
    payload: ResetPasswordPayload,
  ) => Promise<string>;
  logout: () => void;
  getResetToken: () => string;
};

const TOKEN_KEY = "echo_token";
const USER_KEY = "echo_user";
const RESET_TOKEN_KEY = "echo_reset_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(auth: AuthResponse) {
  setCookie(TOKEN_KEY, auth.accessToken, { expiresDays: 7 });
  setJsonCookie(USER_KEY, auth.user, { expiresDays: 7 });
}

function clearAuthPersistence() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

function getStoredToken() {
  return getCookie(TOKEN_KEY) ?? "";
}

function getStoredUser(): AuthUser | null {
  const user = getJsonCookie<AuthUser>(USER_KEY);
  if (!user) {
    clearAuthPersistence();
    return null;
  }

  return user;
}

function getStoredResetToken() {
  return getCookie(RESET_TOKEN_KEY) ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [resetToken, setResetToken] = useState<string>(getStoredResetToken());

  function getResetToken() {
    return resetToken;
  }

  function setAuth(auth: AuthResponse) {
    setToken(auth.accessToken);
    setUser(auth.user);
    persistAuth(auth);
  }

  async function register(payload: RegisterPayload) {
    const auth = await registerApi(payload);
    setAuth(auth);
  }

  async function login(payload: LoginPayload) {
    const auth = await loginApi(payload);
    setAuth(auth);
  }

  async function requestPasswordReset(payload: RequestResetPayload) {
    const result = await requestPasswordResetApi(payload);
    setResetToken(result.resetToken);
    setCookie(RESET_TOKEN_KEY, result.resetToken, {
      maxAgeSeconds: 10 * 60,
    });
    return result.message;
  }

  async function verifyPasswordResetOtp(
    token: string,
    payload: VerifyResetOtpPayload,
  ) {
    const result = await verifyPasswordResetOtpApi(token, payload);
    setResetToken(result.resetToken);
    setCookie(RESET_TOKEN_KEY, result.resetToken, {
      maxAgeSeconds: 10 * 60,
    });

    return result.resetToken;
  }

  async function resetPassword(token: string, payload: ResetPasswordPayload) {
    const result = await resetPasswordApi(token, payload);
    setResetToken("");
    deleteCookie(RESET_TOKEN_KEY);
    return result.message;
  }

  function logout() {
    setToken("");
    setUser(null);
    setResetToken("");
    clearAuthPersistence();
    deleteCookie(RESET_TOKEN_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user?.id),
      register,
      login,
      requestPasswordReset,
      verifyPasswordResetOtp,
      resetPassword,
      logout,
      getResetToken,
    }),
    [token, user, resetToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
