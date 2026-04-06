import { useState, type FormEvent } from "react";
import type { VerifyResetOtpPayload } from "../../types/auth";

type VerifyResetOtpFormProps = {
  loading: boolean;
  defaultEmail?: string;
  onSubmit: (payload: VerifyResetOtpPayload) => Promise<void>;
};

export function VerifyResetOtpForm({
  loading,
  defaultEmail,
  onSubmit,
}: VerifyResetOtpFormProps) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [otp, setOtp] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ email, otp });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Verify Reset Code</h2>
      <p className="small">Step 2 of 3: Enter the OTP sent to your email</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
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
    </form>
  );
}
