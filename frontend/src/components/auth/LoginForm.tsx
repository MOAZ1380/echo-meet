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
    <form className="card" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={6}
        required
      />
      <button disabled={loading} type="submit">
        Login
      </button>

      {/* reset password link */}
      <p className="small">
        <Link to="/auth/request-reset">Forgot your password?</Link>
      </p>

      {/* Register by email */}
      <p className="small">
        Don't have an account? <Link to="/auth/register">Register</Link>
      </p>
    </form>
  );
}
