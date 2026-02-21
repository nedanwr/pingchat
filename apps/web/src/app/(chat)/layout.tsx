import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@pingchat/convex/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

import { ServerRail } from "~/components/chat/server-rail";

export default async function ChatLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/login");
  }

  const preloadedServers = await preloadQuery(
    api.servers.listServers,
    {},
    { token }
  );

  return (
    <main className="bg-background text-foreground relative h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--accent-foreground)/0.08),transparent_40%)]" />
      <div className="bg-background/55 ring-border/40 relative flex h-full w-full overflow-hidden ring-1 backdrop-blur-2xl">
        <ServerRail preloadedServers={preloadedServers} />
        {children}
      </div>
    </main>
  );
}
