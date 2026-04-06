import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { VerifyResetOtpForm } from "../components/auth/VerifyResetOtpForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { VerifyResetOtpPayload } from "../types/auth";

export function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const token = auth.getResetToken();

  if (!token) {
    return <Navigate to="/auth/request-reset" />;
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleVerifyOtp(payload: VerifyResetOtpPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      await auth.verifyPasswordResetOtp(token, payload);
      setInfo("OTP verified");
      navigate("/auth/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell title="Verify OTP" subtitle="Validate your reset code">
      <StatusMessage info={info} error={error} />
      <VerifyResetOtpForm loading={loading} onSubmit={handleVerifyOtp} />
    </AuthPageShell>
  );
}
