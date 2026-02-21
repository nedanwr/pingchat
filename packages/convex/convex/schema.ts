import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("idle"),
        v.literal("dnd"),
        v.literal("invisible"),
        v.literal("offline")
      )
    ),
    presenceLastActiveAt: v.optional(v.number()),
    presenceLastHeartbeatAt: v.optional(v.number()),
    updatedAt: v.optional(v.number())
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("username", ["username"]),

  servers: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    defaultChannelId: v.optional(v.union(v.id("channels"), v.null())),
    updatedAt: v.number()
  }).index("ownerId", ["ownerId"]),

  serverMembers: defineTable({
    serverId: v.id("servers"),
    userId: v.id("users"),
    joinedAt: v.number()
  })
    .index("serverId", ["serverId"])
    .index("userId", ["userId"])
    .index("serverId_userId", ["serverId", "userId"]),

  channels: defineTable({
    name: v.string(),
    type: v.union(
      v.literal(0), // SERVER_CATEGORY
      v.literal(1), // SERVER_TEXT
      v.literal(2), // SERVER_VOICE
      v.literal(3), // DM
      v.literal(4) // GROUP_DM
    ),
    serverId: v.id("servers"),
    position: v.number(),
    topic: v.optional(v.string()),
    parentId: v.optional(v.id("channels"))
  })
    .index("serverId", ["serverId"])
    .index("serverId_position", ["serverId", "position"])
    .index("serverId_type_position", ["serverId", "type", "position"]),

  messages: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    content: v.string(),
    editedTime: v.optional(v.number()),
    type: v.union(
      v.literal(0), // DEFAULT
      v.literal(1) // REPLY
    )
  })
    .index("channelId", ["channelId"])
    .index("channelId_userId", ["channelId", "userId"])
});
