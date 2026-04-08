import { useState, type FormEvent } from "react";
import type { RegisterPayload } from "../../types/auth";
import { Link } from "react-router-dom";

type RegisterFormProps = {
  loading: boolean;
  onSubmit: (payload: RegisterPayload) => Promise<void>;
};

export function RegisterForm({ loading, onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      email,
      password,
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create account</h2>
      <p className="small">Create an account to start and manage rooms.</p>

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
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>

      <button disabled={loading} type="submit" className="auth-primary-btn">
        {loading ? "Creating account..." : "Register"}
      </button>

      <div className="auth-foot-links">
        <span>
          Already have an account? <Link to="/auth/login">Login</Link>
        </span>
        <Link to="/auth/request-reset">Forgot your password?</Link>
      </div>
    </form>
  );
}
