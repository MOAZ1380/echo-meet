import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <main className="app auth-shell">
      <h1>Echo Meet</h1>
      <p className="small">{subtitle}</p>

      <section className="card auth-links">
        <Link to="/auth/login">Login</Link>
        <Link to="/auth/register">Register</Link>
        <Link to="/auth/request-reset">Request Reset</Link>
        <Link to="/auth/reset-password">Reset Password</Link>
      </section>

      <section className="card">
        <h2>{title}</h2>
        {children}
      </section>
    </main>
  );
}
