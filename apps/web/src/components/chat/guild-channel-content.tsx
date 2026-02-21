"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChannelListPane } from "~/components/chat/channel-list-pane";
import { ConversationPane } from "~/components/chat/conversation-pane";

const messageTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit"
});

type GuildChannelContentProps = {
  guildId: string;
  channelId: string;
  preloadedServer: Preloaded<typeof api.servers.getServer>;
  preloadedChannels: Preloaded<typeof api.channels.listServerChannels>;
};

export function GuildChannelContent({
  guildId,
  channelId,
  preloadedServer,
  preloadedChannels
}: GuildChannelContentProps) {
  const [sendError, setSendError] = useState<string | null>(null);
  const router = useRouter();
  const server = usePreloadedQuery(preloadedServer);
  const channels = usePreloadedQuery(preloadedChannels);
  const createMessage = useMutation(api.messages.createMessage);
  const currentUser = useQuery(api.users.getCurrentUser);
  const currentUserDisplayName =
    currentUser?.displayName ?? currentUser?.username ?? "User";

  const textChannels = channels.filter((channel) => channel.type === 1);
  const defaultTextChannel = textChannels[0] ?? null;
  const activeChannel =
    textChannels.find((channel) => channel._id === channelId) ?? null;
  const messages =
    useQuery(
      api.messages.listChannelMessages,
      activeChannel ? { channelId: activeChannel._id } : "skip"
    ) ?? [];

  useEffect(() => {
    if (!defaultTextChannel || activeChannel) {
      return;
    }
    router.replace(`/${guildId}/channels/${defaultTextChannel._id}`);
  }, [activeChannel, defaultTextChannel, guildId, router]);

  useEffect(() => {
    setSendError(null);
  }, [activeChannel?._id]);

  const channelSummaries = channels
    .filter((channel) => channel.type === 0 || channel.type === 1)
    .map((channel) => ({
      id: channel._id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parentId,
      active: channel._id === channelId
    }));
  const channelMessages = messages.map((message) => ({
    id: message._id,
    sender:
      message.userId === currentUser?.id
        ? currentUserDisplayName
        : message.senderName,
    avatarUrl: message.senderAvatarUrl,
    time: messageTimeFormatter.format(message._creationTime),
    content: message.content
  }));

  return (
    <>
      <ChannelListPane
        channels={channelSummaries}
        onSelectChannel={(nextChannelId) => {
          router.push(`/${guildId}/channels/${nextChannelId}`);
        }}
        serverName={server.name}
      />
      <ConversationPane
        composerPlaceholder={
          activeChannel ? `Message #${activeChannel.name}` : "Message"
        }
        onSendMessage={async (content) => {
          if (!activeChannel) {
            return;
          }

          setSendError(null);
          try {
            await createMessage({
              channelId: activeChannel._id,
              content
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to send message";
            setSendError(message);
            throw error;
          }
        }}
        sendError={sendError}
        messages={channelMessages}
        title={activeChannel ? `# ${activeChannel.name}` : ""}
      />
    </>
  );
}
