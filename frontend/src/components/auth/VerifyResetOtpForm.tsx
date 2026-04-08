import { useState, type FormEvent } from "react";
import type { VerifyResetOtpPayload } from "../../types/auth";

type VerifyResetOtpFormProps = {
  loading: boolean;
  onSubmit: (payload: VerifyResetOtpPayload) => Promise<void>;
};

export function VerifyResetOtpForm({
  loading,
  onSubmit,
}: VerifyResetOtpFormProps) {
  const [otp, setOtp] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ otp });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Verify code</h2>
      <p className="small">Step 2 of 3: enter the 6-digit OTP sent to you.</p>

      <label className="auth-field">
        <span>OTP code</span>
        <input
          type="text"
          placeholder="000000"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          pattern="\d{6}"
          maxLength={6}
          required
        />
      </label>

      <button disabled={loading} type="submit" className="auth-primary-btn">
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </form>
  );
}
