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
    <form className="card" onSubmit={handleSubmit}>
      <h2>Verify Reset Code</h2>
      <p className="small">Step 2 of 3: Enter the OTP sent to your email</p>
      <input
        type="text"
        placeholder="OTP (6 digits)"
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        pattern="\d{6}"
        maxLength={6}
        required
      />
      <button disabled={loading} type="submit">
        Verify OTP
      </button>

      {/* button for resend the otp and link to move to the login page*/}
    </form>
  );
}
