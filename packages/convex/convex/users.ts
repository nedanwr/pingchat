import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUserId } from "./authHelpers";
import { buildDefaultAvatarUrl } from "./avatar";

const userStatusValidator = v.union(
  v.literal("online"),
  v.literal("idle"),
  v.literal("dnd"),
  v.literal("invisible"),
  v.literal("offline")
);

type UserStatus = "online" | "idle" | "dnd" | "invisible" | "offline";

const DEFAULT_USER_STATUS: UserStatus = "online";
const ONLINE_TO_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const WEBSOCKET_HEARTBEAT_TIMEOUT_MS = 90 * 1000;

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const avatarUrl =
      user.avatarUrl ??
      buildDefaultAvatarUrl(user.username ?? user.email ?? String(user._id));
    const statusPreference = user.status ?? DEFAULT_USER_STATUS;
    const status = resolveEffectiveStatus({
      statusPreference,
      lastActiveAt: user.presenceLastActiveAt,
      lastHeartbeatAt: user.presenceLastHeartbeatAt,
      now: Date.now()
    });

    return {
      id: user._id,
      displayName: user.displayName ?? user.name ?? null,
      username: user.username ?? null,
      email: user.email ?? null,
      avatarUrl,
      status,
      statusPreference
    };
  }
});

export const setCurrentUserStatus = mutation({
  args: {
    status: userStatusValidator
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const now = Date.now();

    await ctx.db.patch(userId, {
      status: args.status,
      ...(args.status === "online"
        ? {
            presenceLastActiveAt: now,
            presenceLastHeartbeatAt: now
          }
        : {}),
      updatedAt: now
    });

    return { success: true };
  }
});

export const touchCurrentUserPresence = mutation({
  args: {
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    await ctx.db.patch(userId, {
      ...(user.status === undefined ? { status: DEFAULT_USER_STATUS } : {}),
      presenceLastHeartbeatAt: now,
      ...(args.isActive ? { presenceLastActiveAt: now } : {}),
      updatedAt: now
    });

    return { success: true };
  }
});

function resolveEffectiveStatus(args: {
  statusPreference: UserStatus;
  lastActiveAt: number | undefined;
  lastHeartbeatAt: number | undefined;
  now: number;
}): UserStatus {
  const hasLiveConnection =
    typeof args.lastHeartbeatAt === "number" &&
    args.now - args.lastHeartbeatAt <= WEBSOCKET_HEARTBEAT_TIMEOUT_MS;
  if (!hasLiveConnection) {
    return "offline";
  }

  if (args.statusPreference !== "online") {
    return args.statusPreference;
  }

  const hasRecentActivity =
    typeof args.lastActiveAt === "number" &&
    args.now - args.lastActiveAt <= ONLINE_TO_IDLE_TIMEOUT_MS;

  return hasRecentActivity ? "online" : "idle";
}
