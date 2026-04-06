import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { ResetPasswordPayload } from "../types/auth";

type ResetPasswordLocationState = {
  email?: string;
  resetToken?: string;
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const state = location.state as ResetPasswordLocationState | null;

  const email = state?.email || "";
  const resetToken = state?.resetToken || "";

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleResetPassword(payload: ResetPasswordPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.resetPassword(payload);
      await auth.login({
        email: payload.email,
        password: payload.newPassword,
      });

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
      subtitle="Set your new password after OTP verification"
    >
      {!email || !resetToken ? (
        <p className="err">
          Please complete OTP verification first, then return to this page.
        </p>
      ) : null}
      <StatusMessage info={info} error={error} />
      <ResetPasswordForm
        email={email}
        resetToken={resetToken}
        loading={loading || !email || !resetToken}
        onSubmit={handleResetPassword}
      />
    </AuthPageShell>
  );
}
