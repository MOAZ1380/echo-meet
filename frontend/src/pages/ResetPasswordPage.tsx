import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { ResetPasswordPayload } from "../types/auth";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleResetPassword(payload: ResetPasswordPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.resetPassword(payload);
      setInfo("Password reset and logged in");
      navigate("/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset password failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell
      title="Reset Password"
      subtitle="Enter reset code and new password"
    >
      <StatusMessage info={info} error={error} />
      <ResetPasswordForm loading={loading} onSubmit={handleResetPassword} />
    </AuthPageShell>
  );
}
