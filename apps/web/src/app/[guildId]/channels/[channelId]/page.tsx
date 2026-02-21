"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Id } from "@pingchat/convex/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChannelListPane } from "~/components/chat/channel-list-pane";
import { ConversationPane } from "~/components/chat/conversation-pane";
import { ServerRail } from "~/components/chat/server-rail";

const currentUser = "You";
const currentUserAvatarUrl = "https://i.pravatar.cc/80?img=12";

const channelMessages = [
  {
    id: "1",
    sender: "Kai",
    avatarUrl: "https://i.pravatar.cc/80?img=14",
    time: "9:41 AM",
    content: "Can we align on the server navigation spacing before lunch?"
  },
  {
    id: "2",
    sender: currentUser,
    avatarUrl: currentUserAvatarUrl,
    time: "9:43 AM",
    content:
      "Yes. I can push a pass that matches auth surface spacing in 10 minutes."
  },
  {
    id: "3",
    sender: "Kai",
    avatarUrl: "https://i.pravatar.cc/80?img=14",
    time: "9:44 AM",
    content: "Perfect. Send it here when ready and I will review immediately."
  }
] as const;

export default function GuildChannelPage() {
  const params = useParams<{ guildId: string; channelId: string }>();
  const router = useRouter();
  const guildId = params.guildId;
  const channelId = params.channelId;

  const server = useQuery(
    api.servers.getServer,
    guildId ? { serverId: guildId as Id<"servers"> } : "skip"
  );
  const channels = useQuery(
    api.channels.listServerChannels,
    guildId ? { serverId: guildId as Id<"servers"> } : "skip"
  );

  const resolvedChannels = channels ?? [];
  const textChannels = resolvedChannels.filter((channel) => channel.type === 1);
  const defaultTextChannel = textChannels[0] ?? null;
  const activeChannel =
    textChannels.find((channel) => channel._id === channelId) ?? null;

  useEffect(() => {
    if (!guildId || channels === undefined || !defaultTextChannel) {
      return;
    }
    if (activeChannel) {
      return;
    }
    router.replace(`/${guildId}/channels/${defaultTextChannel._id}`);
  }, [activeChannel, channels, defaultTextChannel, guildId, router]);

  const channelSummaries = resolvedChannels
    .filter((channel) => channel.type === 0 || channel.type === 1)
    .map((channel) => ({
      id: channel._id,
      name: channel.name,
      type: channel.type === 0 ? 0 : 1,
      parentId: channel.parentId,
      active: channel._id === channelId
    }));

  return (
    <main className="bg-background text-foreground relative h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--accent-foreground)/0.08),transparent_40%)]" />
      <div className="bg-background/55 ring-border/40 relative flex h-full w-full overflow-hidden ring-1 backdrop-blur-2xl">
        <ServerRail />
        <ChannelListPane
          channels={channelSummaries}
          onSelectChannel={(nextChannelId) => {
            router.push(`/${guildId}/channels/${nextChannelId}`);
          }}
          serverName={server?.name ?? "Server"}
        />
        <ConversationPane
          composerPlaceholder={
            activeChannel ? `Message #${activeChannel.name}` : "Message"
          }
          messages={channelMessages}
          title={activeChannel ? `# ${activeChannel.name}` : ""}
        />
      </div>
    </main>
  );
}
