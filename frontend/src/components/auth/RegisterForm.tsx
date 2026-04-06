import { useState, type FormEvent } from "react";
import type { RegisterPayload } from "../../types/auth";
import { Link, Navigate } from "react-router-dom";

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
    // move to the next page
    <Navigate to="/auth/request-reset" />;
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Register</h2>
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
      <p className="small">
        If name is empty, we will use your email text before @.
      </p>
      <button disabled={loading} type="submit">
        Register
      </button>

      {/* Login by email */}
      <p className="small">
        Already have an account? <Link to="/auth/login">Login</Link>
      </p>

      {/* forget password link */}
      <p className="small">
        <Link to="/auth/request-reset">Forgot your password?</Link>
      </p>
    </form>
  );
}
