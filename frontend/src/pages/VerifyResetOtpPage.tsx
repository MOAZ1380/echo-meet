import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { VerifyResetOtpForm } from "../components/auth/VerifyResetOtpForm";
import { StatusMessage } from "../components/common/StatusMessage";
import { useAuth } from "../hooks/useAuth";
import type { VerifyResetOtpPayload } from "../types/auth";

type VerifyResetLocationState = {
  email?: string;
};

export function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const state = location.state as VerifyResetLocationState | null;

  if (auth.isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  async function handleVerifyOtp(payload: VerifyResetOtpPayload) {
    setLoading(true);
    setInfo("");
    setError("");

    try {
      const resetToken = await auth.verifyPasswordResetOtp(payload);
      setInfo("OTP verified");
      navigate("/auth/reset-password", {
        state: {
          email: payload.email,
          resetToken,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell title="Verify OTP" subtitle="Validate your reset code">
      <StatusMessage info={info} error={error} />
      <VerifyResetOtpForm
        loading={loading}
        defaultEmail={state?.email}
        onSubmit={handleVerifyOtp}
      />
    </AuthPageShell>
  );
}
