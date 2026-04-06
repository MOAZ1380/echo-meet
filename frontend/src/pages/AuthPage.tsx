import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { RequestResetForm } from "../components/auth/RequestResetForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type {
  LoginPayload,
  RegisterPayload,
  RequestResetPayload,
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
    const navigate = useNavigate();
    try {
      const message = await auth.requestPasswordReset(payload);
      setInfo(message || "Reset code sent");
      navigate("/auth/verify-reset-otp", {
        state: { email: payload.email },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cannot request reset code",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <h1>Echo Meet</h1>

      <StatusMessage info={info} error={error} />

      <section className="grid">
        <RegisterForm loading={loading} onSubmit={handleRegister} />
        <LoginForm loading={loading} onSubmit={handleLogin} />
      </section>

      <section className="grid">
        <RequestResetForm loading={loading} onSubmit={handleRequestReset} />
        <section className="card">
          <h2>Reset Password</h2>
          <p className="small">
            Use the new 3-step flow: request code, verify OTP, then reset
            password.
          </p>
        </section>
      </section>
    </main>
  );
}
