import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageShell({ subtitle, children }: AuthPageShellProps) {
  return (
    <main className="app auth-shell">
      <h1>Echo Meet</h1>
      <p className="small">{subtitle}</p>

      <section className="card auth-links">
        <Link to="/auth/login">Login</Link>
        <Link to="/auth/register">Register</Link>
        <Link to="/auth/request-reset">Reset: Step 1</Link>
        <Link to="/auth/verify-reset-otp">Reset: Step 2</Link>
        <Link to="/auth/reset-password">Reset: Step 3</Link>
      </section>

      <section className="card">{children}</section>
    </main>
  );
}
