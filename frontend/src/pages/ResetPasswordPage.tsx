import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { ResetPasswordPayload } from "../types/auth";

export function ResetPasswordPage() {
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [isResetCompleted, setIsResetCompleted] = useState(false);

  const token = auth.getResetToken();

  if (isResetCompleted) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!token) {
    return <Navigate to="/auth/request-reset" replace />;
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleResetPassword(payload: ResetPasswordPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.resetPassword(token, payload);

      setInfo("Password reset please login again");
      setIsResetCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset password failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell
      title="Reset Password"
      subtitle="Set your new password after OTP verification"
    >
      <StatusMessage info={info} error={error} />
      <ResetPasswordForm loading={loading} onSubmit={handleResetPassword} />
    </AuthPageShell>
  );
}
