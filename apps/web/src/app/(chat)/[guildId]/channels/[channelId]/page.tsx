import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@pingchat/convex/convex/_generated/api";
import type { Id } from "@pingchat/convex/convex/_generated/dataModel";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
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
  const requestedChannelId = channelId as Id<"channels">;
  const [preloadedServer, preloadedChannels] = await Promise.all([
    preloadQuery(api.servers.getServer, { serverId }, { token }),
    preloadQuery(api.channels.listServerChannels, { serverId }, { token })
  ]);

  const channels = preloadedQueryResult(preloadedChannels);
  const textChannels = channels.filter((channel) => channel.type === 1);
  const activeTextChannel =
    textChannels.find((channel) => channel._id === requestedChannelId) ??
    textChannels[0] ??
    null;

  if (activeTextChannel && activeTextChannel._id !== requestedChannelId) {
    redirect(`/${guildId}/channels/${activeTextChannel._id}`);
  }

  const preloadedMessages = activeTextChannel
    ? await preloadQuery(
        api.messages.listChannelMessagesPage,
        {
          channelId: activeTextChannel._id,
          paginationOpts: {
            numItems: 50,
            cursor: null
          }
        },
        { token }
      )
    : null;

  return (
    <GuildChannelContent
      channelId={channelId}
      guildId={guildId}
      preloadedChannels={preloadedChannels}
      preloadedMessages={preloadedMessages}
      preloadedServer={preloadedServer}
    />
  );
}
