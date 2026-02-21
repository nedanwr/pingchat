import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@pingchat/convex/convex/_generated/api";
import type { Id } from "@pingchat/convex/convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

import { GuildChannelContent } from "~/components/chat/guild-channel-content";

type GuildChannelPageProps = {
  params: Promise<{
    guildId: string;
    channelId: string;
  }>;
};

export default async function GuildChannelPage({ params }: GuildChannelPageProps) {
  const { guildId, channelId } = await params;
  const token = await convexAuthNextjsToken();

  if (!token) {
    redirect("/login");
  }

  const serverId = guildId as Id<"servers">;
  const [preloadedServer, preloadedChannels] = await Promise.all([
    preloadQuery(api.servers.getServer, { serverId }, { token }),
    preloadQuery(api.channels.listServerChannels, { serverId }, { token })
  ]);

  return (
    <GuildChannelContent
      channelId={channelId}
      guildId={guildId}
      preloadedChannels={preloadedChannels}
      preloadedServer={preloadedServer}
    />
  );
}
