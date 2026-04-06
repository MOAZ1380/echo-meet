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
      <section className="card">{children}</section>
    </main>
  );
}
