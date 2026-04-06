import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { RegisterForm } from "../components/auth/RegisterForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { RegisterPayload } from "../types/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleRegister(payload: RegisterPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.register(payload);
      setInfo("Registered and logged in");
      navigate("/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell title="Register" subtitle="Create your account">
      <StatusMessage info={info} error={error} />
      <RegisterForm loading={loading} onSubmit={handleRegister} />
    </AuthPageShell>
  );
}
