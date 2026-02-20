import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground relative min-h-screen w-full overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--accent-foreground)/0.08),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center justify-center">
        <div className="bg-background/45 ring-border/50 w-full max-w-md rounded-3xl p-1 shadow-[0_24px_80px_-32px_hsl(var(--foreground)/0.45)] ring-1 backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
