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
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Reset password</h2>
      <p className="small">Step 3 of 3: set your new password.</p>

      <label className="auth-field">
        <span>New password</span>
        <input
          type="password"
          placeholder="Minimum 6 characters"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>

      <label className="auth-field">
        <span>Confirm password</span>
        <input
          type="password"
          placeholder="Repeat the new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>

      {validationError ? <p className="err">{validationError}</p> : null}
      <button disabled={loading} type="submit" className="auth-primary-btn">
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}
