import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
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
    const serverId = await createServerRecord(ctx, {
      ownerId: userId,
      name: args.name,
      description: args.description,
      iconUrl: args.iconUrl
    });

    const categoryId = await createCategoryChannel(ctx, {
      serverId,
      name: "Text Channels",
      position: 0
    });

    await createTextChannel(ctx, {
      serverId,
      name: "general",
      position: 0,
      parentId: categoryId
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

export const listServers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const servers = await Promise.all(
      memberships.map(async (membership) => await ctx.db.get(membership.serverId))
    );

    return servers.filter((server) => server !== null);
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
      ...(args.description !== undefined
        ? { description: args.description }
        : {}),
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

async function createServerRecord(
  ctx: MutationCtx,
  args: {
    ownerId: Id<"users">;
    name: string;
    description: string | undefined;
    iconUrl: string | undefined;
  }
) {
  return await ctx.db.insert("servers", {
    name: args.name,
    ownerId: args.ownerId,
    updatedAt: Date.now(),
    ...(args.description !== undefined
      ? { description: args.description }
      : {}),
    ...(args.iconUrl !== undefined ? { iconUrl: args.iconUrl } : {})
  });
}

async function createCategoryChannel(
  ctx: MutationCtx,
  args: {
    serverId: Id<"servers">;
    name: string;
    position: number;
  }
) {
  return await ctx.db.insert("channels", {
    name: args.name,
    type: 0,
    serverId: args.serverId,
    position: args.position
  });
}

async function createTextChannel(
  ctx: MutationCtx,
  args: {
    serverId: Id<"servers">;
    name: string;
    position: number;
    parentId: Id<"channels">;
  }
) {
  return await ctx.db.insert("channels", {
    name: args.name,
    type: 1,
    serverId: args.serverId,
    position: args.position,
    parentId: args.parentId
  });
}
