"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Id } from "@pingchat/convex/convex/_generated/dataModel";
import type { Preloaded } from "convex/react";
import { useConvex, useMutation, usePreloadedQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChannelListPane } from "~/components/chat/channel-list-pane";
import { ConversationPane } from "~/components/chat/conversation-pane";
import { useCurrentSidebarUser } from "~/integrations/convex/current-user-provider";
import { useAppNavigation } from "~/lib/use-app-navigation";
import { useLastAccessedChannelStore } from "~/stores/last-accessed-channel-store";

const INITIAL_MESSAGES_PAGE_SIZE = 50;

const messageTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit"
});

type GuildChannelContentProps = {
  guildId: string;
  channelId: string;
  preloadedServer: Preloaded<typeof api.servers.getServer>;
  preloadedChannels: Preloaded<typeof api.channels.listServerChannels>;
  preloadedMessages: Preloaded<typeof api.messages.listChannelMessagesPage> | null;
};

export function GuildChannelContent({
  guildId,
  channelId,
  preloadedServer,
  preloadedChannels,
  preloadedMessages
}: GuildChannelContentProps) {
  const [sendError, setSendError] = useState<string | null>(null);
  const router = useAppNavigation();
  const server = usePreloadedQuery(preloadedServer);
  const channels = usePreloadedQuery(preloadedChannels);
  const { user: currentUser } = useCurrentSidebarUser();
  const currentUserDisplayName = currentUser?.name ?? "User";
  const currentUserAvatarUrl = currentUser?.avatarUrl ?? "";
  const currentUserId = currentUser?.id as Id<"users"> | undefined;
  const prefetchedRoutesRef = useRef(new Set<string>());
  const setLastAccessedChannel = useLastAccessedChannelStore(
    (state) => state.setLastAccessedChannel
  );

  const createMessage = useMutation(
    api.messages.createMessage
  ).withOptimisticUpdate((localStore, args) => {
    const queryArgs = {
      channelId: args.channelId,
      paginationOpts: {
        numItems: INITIAL_MESSAGES_PAGE_SIZE,
        cursor: null
      }
    } as const;
    const existingMessagesPage = localStore.getQuery(
      api.messages.listChannelMessagesPage,
      queryArgs
    );
    if (existingMessagesPage === undefined) {
      return;
    }

    localStore.setQuery(api.messages.listChannelMessagesPage, queryArgs, {
      ...existingMessagesPage,
      page: [
        {
          _id: `optimistic-${Date.now()}-${Math.random()}` as Id<"messages">,
          _creationTime: Date.now(),
          channelId: args.channelId,
          userId: (currentUserId ?? "optimistic-user") as Id<"users">,
          content: args.content,
          type: args.type ?? 0,
          senderName: currentUserDisplayName,
          senderAvatarUrl: currentUserAvatarUrl
        },
        ...existingMessagesPage.page
      ].slice(0, INITIAL_MESSAGES_PAGE_SIZE)
    });
  });

  const textChannels = useMemo(
    () => channels.filter((channel) => channel.type === 1),
    [channels]
  );
  const defaultTextChannel = textChannels[0] ?? null;
  const activeChannel =
    textChannels.find((channel) => channel._id === channelId) ?? null;
  const activeChannelId = activeChannel?._id ?? null;

  useEffect(() => {
    if (!defaultTextChannel || activeChannelId) {
      return;
    }
    setLastAccessedChannel(guildId, defaultTextChannel._id);
    router.replace(`/${guildId}/channels/${defaultTextChannel._id}`);
  }, [
    activeChannelId,
    defaultTextChannel,
    guildId,
    router,
    setLastAccessedChannel
  ]);

  useEffect(() => {
    if (!activeChannelId) {
      return;
    }
    setLastAccessedChannel(guildId, activeChannelId);
  }, [activeChannelId, guildId, setLastAccessedChannel]);

  useEffect(() => {
    setSendError(null);
  }, [activeChannel?._id]);

  const channelSummaries = useMemo(
    () =>
      channels
        .filter((channel) => channel.type === 0 || channel.type === 1)
        .map((channel) => ({
          id: channel._id,
          name: channel.name,
          type: channel.type,
          parentId: channel.parentId,
          active: channel._id === channelId
        })),
    [channelId, channels]
  );

  const prefetchChannelRoute = (nextChannelId: string) => {
    const route = `/${guildId}/channels/${nextChannelId}`;
    if (prefetchedRoutesRef.current.has(route)) {
      return;
    }
    prefetchedRoutesRef.current.add(route);
    void router.prefetch(route);
  };

  return (
    <>
      <ChannelListPane
        channels={channelSummaries}
        onPrefetchChannel={prefetchChannelRoute}
        onSelectChannel={(nextChannelId) => {
          setLastAccessedChannel(guildId, nextChannelId);
          router.push(`/${guildId}/channels/${nextChannelId}`);
        }}
        serverName={server.name}
      />

      {activeChannel && preloadedMessages ? (
        <ActiveChannelConversation
          key={activeChannel._id}
          activeChannelId={activeChannel._id}
          activeChannelName={activeChannel.name}
          currentUserDisplayName={currentUserDisplayName}
          currentUserId={currentUserId}
          onCreateMessage={createMessage}
          preloadedMessages={preloadedMessages}
          sendError={sendError}
          setSendError={setSendError}
        />
      ) : (
        <ConversationPane
          composerPlaceholder="Message"
          messages={[]}
          sendError={sendError}
          title=""
        />
      )}
    </>
  );
}

type ActiveChannelConversationProps = {
  activeChannelId: Id<"channels">;
  activeChannelName: string;
  currentUserDisplayName: string;
  currentUserId: Id<"users"> | undefined;
  onCreateMessage: (args: {
    channelId: Id<"channels">;
    content: string;
  }) => Promise<unknown>;
  preloadedMessages: Preloaded<typeof api.messages.listChannelMessagesPage>;
  sendError: string | null;
  setSendError: (error: string | null) => void;
};

function ActiveChannelConversation({
  activeChannelId,
  activeChannelName,
  currentUserDisplayName,
  currentUserId,
  onCreateMessage,
  preloadedMessages,
  sendError,
  setSendError
}: ActiveChannelConversationProps) {
  const convex = useConvex();
  const messagesPage = usePreloadedQuery(preloadedMessages);
  const [olderMessages, setOlderMessages] = useState<typeof messagesPage.page>(
    []
  );
  const [nextOlderCursor, setNextOlderCursor] = useState(
    messagesPage.continueCursor
  );
  const [hasOlderMessages, setHasOlderMessages] = useState(!messagesPage.isDone);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  useEffect(() => {
    if (olderMessages.length > 0) {
      return;
    }
    setNextOlderCursor(messagesPage.continueCursor);
    setHasOlderMessages(!messagesPage.isDone);
  }, [messagesPage.continueCursor, messagesPage.isDone, olderMessages.length]);

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasOlderMessages || !nextOlderCursor) {
      return;
    }

    setIsLoadingOlderMessages(true);

    try {
      const nextPage = await convex.query(api.messages.listChannelMessagesPage, {
        channelId: activeChannelId,
        paginationOpts: {
          numItems: INITIAL_MESSAGES_PAGE_SIZE,
          cursor: nextOlderCursor
        }
      });

      setOlderMessages((currentOlderMessages) => [
        ...currentOlderMessages,
        ...nextPage.page
      ]);
      setNextOlderCursor(nextPage.continueCursor);
      setHasOlderMessages(!nextPage.isDone);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const allChannelMessagesDescending = useMemo(() => {
    const mergedMessages = [...messagesPage.page, ...olderMessages];
    const seenMessageIds = new Set<string>();
    return mergedMessages.filter((message) => {
      if (seenMessageIds.has(message._id)) {
        return false;
      }
      seenMessageIds.add(message._id);
      return true;
    });
  }, [messagesPage.page, olderMessages]);

  const channelMessages = useMemo(
    () =>
      [...allChannelMessagesDescending].reverse().map((message) => ({
        id: message._id,
        sender:
          message.userId === currentUserId
            ? currentUserDisplayName
            : message.senderName,
        avatarUrl: message.senderAvatarUrl,
        time: messageTimeFormatter.format(message._creationTime),
        content: message.content
      })),
    [allChannelMessagesDescending, currentUserDisplayName, currentUserId]
  );

  return (
    <ConversationPane
      canLoadOlderMessages={hasOlderMessages}
      composerPlaceholder={`Message #${activeChannelName}`}
      isLoadingOlderMessages={isLoadingOlderMessages}
      onLoadOlderMessages={loadOlderMessages}
      onSendMessage={async (content) => {
        setSendError(null);
        try {
          await onCreateMessage({
            channelId: activeChannelId,
            content
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to send message";
          setSendError(message);
          throw error;
        }
      }}
      sendError={sendError}
      scrollIdentity={activeChannelId}
      messages={channelMessages}
      title={`# ${activeChannelName}`}
    />
  );
}
