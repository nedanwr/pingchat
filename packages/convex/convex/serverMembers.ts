import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireServer(ctx: Ctx, serverId: Id<"servers">) {
  const server = await ctx.db.get(serverId);
  if (!server) {
    throw new Error("Server not found");
  }
  return server;
}

export async function requireServerOwner(
  ctx: Ctx,
  serverId: Id<"servers">,
  userId: Id<"users">
) {
  const server = await requireServer(ctx, serverId);
  if (server.ownerId !== userId) {
    throw new Error("Not authorized to manage this server");
  }
  return server;
}

export async function getServerMembership(
  ctx: Ctx,
  serverId: Id<"servers">,
  userId: Id<"users">
) {
  return await ctx.db
    .query("serverMembers")
    .withIndex("serverId_userId", (q) =>
      q.eq("serverId", serverId).eq("userId", userId)
    )
    .unique();
}

export async function requireServerMember(
  ctx: Ctx,
  serverId: Id<"servers">,
  userId: Id<"users">
) {
  const membership = await getServerMembership(ctx, serverId, userId);
  if (!membership) {
    throw new Error("Not authorized to access this server");
  }
  return await requireServer(ctx, serverId);
}

export async function addServerMember(
  ctx: MutationCtx,
  serverId: Id<"servers">,
  userId: Id<"users">
): Promise<{ membership: Doc<"serverMembers">; joinedNow: boolean }> {
  const existingMembership = await getServerMembership(ctx, serverId, userId);
  if (existingMembership) {
    return { membership: existingMembership, joinedNow: false };
  }

  const membershipId = await ctx.db.insert("serverMembers", {
    serverId,
    userId,
    joinedAt: Date.now()
  });

  const membership = await ctx.db.get(membershipId);
  if (!membership) {
    throw new Error("Failed to create server membership");
  }

  return { membership, joinedNow: true };
}
