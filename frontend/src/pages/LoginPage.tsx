import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { LoginPayload } from "../types/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleLogin(payload: LoginPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.login(payload);
      setInfo("Logged in");
      navigate("/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell title="Login" subtitle="Sign in to create room">
      <StatusMessage info={info} error={error} />
      <LoginForm loading={loading} onSubmit={handleLogin} />
    </AuthPageShell>
  );
}
