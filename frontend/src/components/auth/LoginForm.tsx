import { useState, type FormEvent } from "react";
import type { LoginPayload } from "../../types/auth";
import { Link } from "react-router-dom";

type LoginFormProps = {
  loading: boolean;
  onSubmit: (payload: LoginPayload) => Promise<void>;
};

export function LoginForm({ loading, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign in</h2>
      <p className="small">Access your rooms and create new meetings.</p>

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

      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>

      <button disabled={loading} type="submit" className="auth-primary-btn">
        {loading ? "Signing in..." : "Login"}
      </button>

      <div className="auth-foot-links">
        <Link to="/auth/request-reset">Forgot your password?</Link>
        <span>
          Don't have an account? <Link to="/auth/register">Register</Link>
        </span>
      </div>
    </form>
  );
}
