import { useState, type FormEvent } from "react";
import type { ResetPasswordPayload } from "../../types/auth";

type ResetPasswordFormProps = {
  loading: boolean;
  onSubmit: (payload: ResetPasswordPayload) => Promise<void>;
};

export function ResetPasswordForm({
  loading,
  onSubmit,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ email, otp, newPassword });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Reset code (6 digits)"
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        pattern="\d{6}"
        required
      />
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        minLength={6}
        required
      />
      <button disabled={loading} type="submit">
        Reset Password
      </button>
    </form>
  );
}
