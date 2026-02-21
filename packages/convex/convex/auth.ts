import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { type Value } from "convex/values";

import { buildDefaultAvatarUrl } from "./avatar";

type PasswordProfile = {
  email: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params): PasswordProfile => {
        const flow = params.flow;
        const email = getTrimmedString(params.email).toLowerCase();
        if (!email) {
          throw new Error("Email is required");
        }

        const displayName = getTrimmedOptionalString(params.displayName);
        const avatarUrl = getTrimmedOptionalString(params.avatarUrl);

        if (avatarUrl && !isValidUrl(avatarUrl)) {
          throw new Error("avatarUrl must be a valid URL");
        }

        if (flow !== "signUp") {
          return {
            email,
            ...(displayName ? { displayName } : {}),
            ...(displayName ? { name: displayName } : {}),
            ...(avatarUrl ? { avatarUrl } : {})
          };
        }

        const username = normalizeUsername(getTrimmedString(params.username));
        if (!username) {
          throw new Error("Username is required");
        }
        const resolvedAvatarUrl =
          avatarUrl ?? buildDefaultAvatarUrl(username || email);

        return {
          email,
          username,
          ...(displayName ? { displayName } : {}),
          ...(displayName ? { name: displayName } : {}),
          ...(resolvedAvatarUrl ? { avatarUrl: resolvedAvatarUrl } : {})
        };
      }
    })
  ]
});

function getTrimmedString(value: Value | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function getTrimmedOptionalString(value: Value | undefined) {
  const parsed = getTrimmedString(value);
  return parsed.length > 0 ? parsed : undefined;
}

function normalizeUsername(username: string) {
  const normalized = username.toLowerCase().replace(/^@+/, "");
  if (!normalized) {
    throw new Error("Username is required");
  }
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    throw new Error(
      "Username may only include letters, numbers, underscores, hyphens, and periods"
    );
  }
  return normalized;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
