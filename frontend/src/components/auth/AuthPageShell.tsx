import type { ReactNode } from "react";

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
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0b1220] via-[#0f1b3d] to-[#050816] px-4">
      <section className="w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="text-3xl font-bold text-blue-400 mb-2">Echo Meet</div>

          <h1 className="text-2xl font-bold text-white">{title}</h1>

          <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
        </header>

        {/* Card */}
        <section className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl w-full">
          {children}
        </section>
      </section>
    </main>
  );
}
