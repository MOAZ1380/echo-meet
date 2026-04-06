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
    console.log("ok");
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

      {/* return for the main auth */}
      <p className="small">
        Already have an account? <Link to="/auth/login">Login</Link>
      </p>

      <p className="small">
        Don't have an account? <Link to="/auth/register">Register</Link>
      </p>
    </form>
  );
}
