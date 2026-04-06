import { useState, type FormEvent } from "react";
import type { LoginPayload } from "../../types/auth";

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
    </form>
  );
}
