import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUserId } from "./authHelpers";
import {
  addServerMember,
  requireServer,
  requireServerMember,
  requireServerOwner
} from "./serverMembers";

export const createServer = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const now = Date.now();

    const serverId = await ctx.db.insert("servers", {
      name: args.name,
      ownerId: userId,
      updatedAt: now,
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.iconUrl !== undefined ? { iconUrl: args.iconUrl } : {})
    });

    await addServerMember(ctx, serverId, userId);

    return await requireServer(ctx, serverId);
  }
});

export const joinServer = mutation({
  args: {
    serverId: v.id("servers")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const server = await requireServer(ctx, args.serverId);
    const { joinedNow } = await addServerMember(ctx, args.serverId, userId);

    return { server, joinedNow };
  }
});

export const getServer = query({
  args: {
    serverId: v.id("servers")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    return await requireServerMember(ctx, args.serverId, userId);
  }
});

export const updateServer = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireServerOwner(ctx, args.serverId, userId);

    if (
      args.name === undefined &&
      args.description === undefined &&
      args.iconUrl === undefined
    ) {
      throw new Error("At least one field must be provided for update");
    }

    await ctx.db.patch(args.serverId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.iconUrl !== undefined ? { iconUrl: args.iconUrl } : {}),
      updatedAt: Date.now()
    });

    return await ctx.db.get(args.serverId);
  }
});

export const deleteServer = mutation({
  args: {
    serverId: v.id("servers")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    await requireServerOwner(ctx, args.serverId, userId);

    const channels = await ctx.db
      .query("channels")
      .withIndex("serverId", (q) => q.eq("serverId", args.serverId))
      .collect();

    for (const channel of channels) {
      await ctx.db.delete(channel._id);
    }

    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("serverId", (q) => q.eq("serverId", args.serverId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    await ctx.db.delete(args.serverId);

    return { success: true };
  }
});
