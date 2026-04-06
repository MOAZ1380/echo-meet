import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { RequestResetForm } from "../components/auth/RequestResetForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { RequestResetPayload } from "../types/auth";

export function RequestResetPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleRequestReset(payload: RequestResetPayload) {
    setLoading(true);
    setInfo("");
    setError("");

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
    <AuthPageShell
      title="Request Password Reset"
      subtitle="Send code to your email"
    >
      <StatusMessage info={info} error={error} />
      <RequestResetForm loading={loading} onSubmit={handleRequestReset} />
    </AuthPageShell>
  );
}
