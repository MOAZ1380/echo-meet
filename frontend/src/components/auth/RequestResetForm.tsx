import { useState, type FormEvent } from "react";
import type { RequestResetPayload } from "../../types/auth";
import { Link } from "react-router-dom";

type RequestResetFormProps = {
  loading: boolean;
  onSubmit: (payload: RequestResetPayload) => Promise<void>;
};

export function RequestResetForm({ loading, onSubmit }: RequestResetFormProps) {
  const [email, setEmail] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ email });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Request reset code</h2>
      <p className="small">Step 1 of 3: enter your account email.</p>

      <label className="auth-field">
        <span>Email</span>
        <input
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <button disabled={loading} type="submit" className="auth-primary-btn">
        {loading ? "Sending code..." : "Send Code"}
      </button>

      <div className="auth-foot-links">
        <span>
          Already have an account? <Link to="/auth/login">Login</Link>
        </span>
        <span>
          Don't have an account? <Link to="/auth/register">Register</Link>
        </span>
      </div>
    </form>
  );
}
