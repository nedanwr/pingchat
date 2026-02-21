import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx
} from "./_generated/server";
import { requireAuthenticatedUserId } from "./authHelpers";
import { requireServerMember } from "./serverMembers";

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

    return await ctx.db
      .query("messages")
      .withIndex("channelId", (q) => q.eq("channelId", args.channelId))
      .collect();
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

  await requireServerMember(ctx, channel.serverId, userId);
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
