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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    setValidationError("");
    await onSubmit({ newPassword });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      <p className="small">Step 3 of 3: Choose a new password</p>
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        minLength={6}
        required
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        minLength={6}
        required
      />
      {validationError ? <p className="err">{validationError}</p> : null}
      <button disabled={loading} type="submit">
        Reset Password
      </button>
    </form>
  );
}
