import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx
} from "./_generated/server";
import { requireAuthenticatedUserId } from "./authHelpers";
import { buildDefaultAvatarUrl } from "./avatar";
import { requireServerMembership } from "./serverMembers";

const messageTypeValidator = v.union(
  v.literal(0), // DEFAULT
  v.literal(1) // REPLY
);

export const createMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    type: v.optional(messageTypeValidator)
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireChannelMemberAccess(ctx, args.channelId, userId);

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      userId,
      content: args.content,
      type: args.type ?? 0
    });

    return await ctx.db.get(messageId);
  }
});

export const getMessage = query({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    return await requireMessageMemberAccess(ctx, args.messageId, userId);
  }
});

export const listChannelMessages = query({
  args: {
    channelId: v.id("channels")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireChannelMemberAccess(ctx, args.channelId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("channelId", (q) => q.eq("channelId", args.channelId))
      .collect();

    return await enrichMessagesWithSender(ctx, messages);
  }
});

export const listChannelMessagesPage = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireChannelMemberAccess(ctx, args.channelId, userId);

    const page = await ctx.db
      .query("messages")
      .withIndex("channelId", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: await enrichMessagesWithSender(ctx, page.page)
    };
  }
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    type: v.optional(messageTypeValidator)
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const message = await requireMessageMemberAccess(
      ctx,
      args.messageId,
      userId
    );

    if (message.userId !== userId) {
      throw new Error("Not authorized to update this message");
    }

    if (args.content === undefined && args.type === undefined) {
      throw new Error("At least one field must be provided for update");
    }

    await ctx.db.patch(args.messageId, {
      ...(args.content !== undefined ? { content: args.content } : {}),
      ...(args.type !== undefined ? { type: args.type } : {}),
      editedTime: Date.now()
    });

    return await ctx.db.get(args.messageId);
  }
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const message = await requireMessageMemberAccess(
      ctx,
      args.messageId,
      userId
    );
    if (message.userId !== userId) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.delete(args.messageId);
    return { success: true };
  }
});

async function requireChannelMemberAccess(
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"channels">,
  userId: Id<"users">
) {
  const channel = await ctx.db.get(channelId);
  if (!channel) {
    throw new Error("Channel not found");
  }

  await requireServerMembership(ctx, channel.serverId, userId);
  return channel;
}

async function requireMessageMemberAccess(
  ctx: QueryCtx | MutationCtx,
  messageId: Id<"messages">,
  userId: Id<"users">
) {
  const message = await ctx.db.get(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  await requireChannelMemberAccess(ctx, message.channelId, userId);
  return message;
}

async function enrichMessagesWithSender(
  ctx: QueryCtx | MutationCtx,
  messages: Doc<"messages">[]
) {
  const uniqueSenderIds = [...new Set(messages.map((message) => message.userId))];
  const senders = await Promise.all(
    uniqueSenderIds.map(async (senderId) => {
      const sender = await ctx.db.get(senderId);
      return [senderId, sender] as const;
    })
  );
  const senderById = new Map(senders);

  return messages.map((message) => {
    const sender = senderById.get(message.userId);
    const senderName = sender?.displayName ?? sender?.username ?? "User";
    const senderAvatarUrl =
      sender?.avatarUrl ??
      buildDefaultAvatarUrl(
        sender?.username ?? sender?.email ?? String(message.userId)
      );

    return {
      ...message,
      senderName,
      senderAvatarUrl
    };
  });
}
