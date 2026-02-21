import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAuthenticatedUserId } from "./authHelpers";
import { requireServerMember } from "./serverMembers";

const channelTypeValidator = v.union(
  v.literal(0), // SERVER_CATEGORY
  v.literal(1), // SERVER_TEXT
  v.literal(2), // SERVER_VOICE
  v.literal(3), // DM
  v.literal(4) // GROUP_DM
);

export const createChannel = mutation({
  args: {
    name: v.string(),
    type: channelTypeValidator,
    serverId: v.id("servers"),
    position: v.number(),
    topic: v.optional(v.string()),
    parentId: v.optional(v.id("channels"))
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireServerMember(ctx, args.serverId, userId);
    await assertValidParentChannel(ctx, args.serverId, args.parentId);

    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      type: args.type,
      serverId: args.serverId,
      position: args.position,
      ...(args.topic !== undefined ? { topic: args.topic } : {}),
      ...(args.parentId !== undefined ? { parentId: args.parentId } : {})
    });

    return await ctx.db.get(channelId);
  }
});

export const getChannel = query({
  args: {
    channelId: v.id("channels")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    await requireServerMember(ctx, channel.serverId, userId);
    return channel;
  }
});

export const updateChannel = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    type: v.optional(channelTypeValidator),
    position: v.optional(v.number()),
    topic: v.optional(v.string()),
    parentId: v.optional(v.id("channels"))
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    await requireServerMember(ctx, channel.serverId, userId);

    if (
      args.name === undefined &&
      args.type === undefined &&
      args.position === undefined &&
      args.topic === undefined &&
      args.parentId === undefined
    ) {
      throw new Error("At least one field must be provided for update");
    }

    if (args.parentId !== undefined && args.parentId === args.channelId) {
      throw new Error("A channel cannot be its own parent");
    }

    await assertValidParentChannel(ctx, channel.serverId, args.parentId);

    await ctx.db.patch(args.channelId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.type !== undefined ? { type: args.type } : {}),
      ...(args.position !== undefined ? { position: args.position } : {}),
      ...(args.topic !== undefined ? { topic: args.topic } : {}),
      ...(args.parentId !== undefined ? { parentId: args.parentId } : {})
    });

    return await ctx.db.get(args.channelId);
  }
});

export const deleteChannel = mutation({
  args: {
    channelId: v.id("channels")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    await requireServerMember(ctx, channel.serverId, userId);
    await ctx.db.delete(args.channelId);

    return { success: true };
  }
});

async function assertValidParentChannel(
  ctx: QueryCtx | MutationCtx,
  serverId: Id<"servers">,
  parentId: Id<"channels"> | undefined
) {
  if (parentId === undefined) {
    return;
  }

  const parentChannel = await ctx.db.get(parentId);
  if (!parentChannel) {
    throw new Error("Parent channel not found");
  }
  if (parentChannel.serverId !== serverId) {
    throw new Error("Parent channel must belong to the same server");
  }
}
