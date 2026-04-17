import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  googleLogin as googleLoginApi,
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
  GoogleLoginPayload,
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
  googleLogin: (payload: GoogleLoginPayload) => Promise<void>;
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

// Persist the signed-in session in cookies so refreshes keep the auth state.
function persistAuth(auth: AuthResponse) {
  setCookie(TOKEN_KEY, auth.accessToken, { expiresDays: 7 });
  setJsonCookie(USER_KEY, auth.user, { expiresDays: 7 });
}

// Remove every cookie related to the auth session.
function clearAuthPersistence() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

// Read the last saved access token from cookies.
function getStoredToken() {
  return getCookie(TOKEN_KEY) ?? "";
}

// Read the last saved user object from cookies.
function getStoredUser(): AuthUser | null {
  const user = getJsonCookie<AuthUser>(USER_KEY);
  if (!user) {
    clearAuthPersistence();
    return null;
  }

  return user;
}

// Read the temporary password-reset token from cookies.
function getStoredResetToken() {
  return getCookie(RESET_TOKEN_KEY) ?? "";
}

// Provides auth state and auth-related actions to the app tree.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [resetToken, setResetToken] = useState<string>(getStoredResetToken());

  // Returns the currently stored password-reset token.
  function getResetToken() {
    return resetToken;
  }

  // Update React state and persisted cookies after login/register.
  function setAuth(auth: AuthResponse) {
    setToken(auth.accessToken);
    setUser(auth.user);
    persistAuth(auth);
  }

  // Register a new account and save the returned session.
  async function register(payload: RegisterPayload) {
    const auth = await registerApi(payload);
    setAuth(auth);
  }

  // Log in with credentials and save the returned session.
  async function login(payload: LoginPayload) {
    const auth = await loginApi(payload);
    setAuth(auth);
  }

  // Log in with a verified Google credential.
  async function googleLogin(payload: GoogleLoginPayload) {
    const auth = await googleLoginApi(payload);
    setAuth(auth);
  }

  // Start the password-reset flow and cache the temporary reset token.
  async function requestPasswordReset(payload: RequestResetPayload) {
    const result = await requestPasswordResetApi(payload);
    setResetToken(result.resetToken);
    setCookie(RESET_TOKEN_KEY, result.resetToken, {
      maxAgeSeconds: 10 * 60,
    });
    return result.message;
  }

  // Verify the OTP and replace the reset token with the next step token.
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

  // Finalize password reset and clear the temporary reset token.
  async function resetPassword(token: string, payload: ResetPasswordPayload) {
    const result = await resetPasswordApi(token, payload);
    setResetToken("");
    deleteCookie(RESET_TOKEN_KEY);
    return result.message;
  }

  // Fully sign the user out and clear persisted session data.
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
      googleLogin,
      requestPasswordReset,
      verifyPasswordResetOtp,
      resetPassword,
      logout,
      getResetToken,
    }),
    [token, user, resetToken, googleLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Read auth state from the nearest AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
