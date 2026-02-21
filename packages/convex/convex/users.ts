import { getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";
import { buildDefaultAvatarUrl } from "./avatar";

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

    return {
      id: user._id,
      displayName: user.displayName ?? user.name ?? null,
      username: user.username ?? null,
      email: user.email ?? null,
      avatarUrl
    };
  }
});
