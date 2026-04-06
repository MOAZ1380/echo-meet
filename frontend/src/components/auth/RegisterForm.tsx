import { useState, type FormEvent } from "react";
import type { RegisterPayload } from "../../types/auth";

type RegisterFormProps = {
  loading: boolean;
  onSubmit: (payload: RegisterPayload) => Promise<void>;
};

export function RegisterForm({ loading, onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      email,
      password,
      name: name || undefined,
    });
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
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button disabled={loading} type="submit">
        Register
      </button>
    </form>
  );
}
