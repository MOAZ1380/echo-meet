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
} from "../api/authApi";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
} from "../types/auth";

type AuthContextValue = {
  token: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  requestPasswordReset: (payload: RequestResetPayload) => Promise<string>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "echo_token";
const USER_KEY = "echo_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

function clearAuthPersistence() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuthPersistence();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());

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
    return result.message;
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    const auth = await resetPasswordApi(payload);
    setAuth(auth);
  }

  function logout() {
    setToken("");
    setUser(null);
    clearAuthPersistence();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      register,
      login,
      requestPasswordReset,
      resetPassword,
      logout,
    }),
    [token, user],
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
