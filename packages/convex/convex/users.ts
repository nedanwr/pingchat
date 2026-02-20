import { getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";

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

    return {
      id: user._id,
      displayName: user.displayName ?? user.name ?? null,
      username: user.username ?? null,
      email: user.email ?? null,
      imageUrl: user.imageUrl ?? user.image ?? null
    };
  }
});
