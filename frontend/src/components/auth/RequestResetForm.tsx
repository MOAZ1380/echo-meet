import { useState, type FormEvent } from "react";
import type { RequestResetPayload } from "../../types/auth";

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
    <form className="card" onSubmit={handleSubmit}>
      <h2>Request Reset Code</h2>
      <p className="small">Step 1 of 3: Enter your email</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <button disabled={loading} type="submit">
        Send Code
      </button>
    </form>
  );
}
