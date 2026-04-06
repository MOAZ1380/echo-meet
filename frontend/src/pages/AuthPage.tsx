import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { RequestResetForm } from "../components/auth/RequestResetForm";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type {
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
  ResetPasswordPayload,
} from "../types/auth";

export function AuthPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  function resetStatus() {
    setInfo("");
    setError("");
  }

  async function handleRegister(payload: RegisterPayload) {
    setLoading(true);
    resetStatus();
    try {
      await auth.register(payload);
      setInfo("Registered and logged in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(payload: LoginPayload) {
    setLoading(true);
    resetStatus();
    try {
      await auth.login(payload);
      setInfo("Logged in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReset(payload: RequestResetPayload) {
    setLoading(true);
    resetStatus();
    try {
      const message = await auth.requestPasswordReset(payload);
      setInfo(message || "Reset code sent");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cannot request reset code",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(payload: ResetPasswordPayload) {
    setLoading(true);
    resetStatus();
    try {
      await auth.resetPassword(payload);
      setInfo("Password reset and logged in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset password failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <h1>Echo Meet</h1>
      <p className="small">Simple auth page</p>

      <StatusMessage info={info} error={error} />

      <section className="grid">
        <RegisterForm loading={loading} onSubmit={handleRegister} />
        <LoginForm loading={loading} onSubmit={handleLogin} />
      </section>

      <section className="grid">
        <RequestResetForm loading={loading} onSubmit={handleRequestReset} />
        <ResetPasswordForm loading={loading} onSubmit={handleResetPassword} />
      </section>
    </main>
  );
}
