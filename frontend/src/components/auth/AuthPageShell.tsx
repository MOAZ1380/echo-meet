import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageShell({
  title,
  subtitle,
  children,
}: AuthPageShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-shell-header">
          <div className="auth-brand-mark">Echo Meet</div>
          <h1 className="auth-shell-title">{title}</h1>
          <p className="small">{subtitle}</p>
          <nav className="auth-shell-links" aria-label="Authentication links">
            <Link to="/join">Join as guest</Link>
            <Link to="/auth/login">Login</Link>
            <Link to="/auth/register">Register</Link>
          </nav>
        </header>

        <section className="auth-shell-card">{children}</section>
      </section>
    </main>
  );
}
