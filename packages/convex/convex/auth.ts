import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { type Value } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => {
        const flow = params.flow;
        const email = getTrimmedString(params.email).toLowerCase();
        if (!email) {
          throw new Error("Email is required");
        }

        const displayName = getTrimmedOptionalString(params.displayName);
        const imageUrl = getTrimmedOptionalString(params.imageUrl);

        if (imageUrl && !isValidUrl(imageUrl)) {
          throw new Error("imageUrl must be a valid URL");
        }

        if (flow !== "signUp") {
          return {
            email,
            ...(displayName ? { displayName } : {}),
            ...(displayName ? { name: displayName } : {}),
            ...(imageUrl ? { imageUrl } : {}),
            ...(imageUrl ? { image: imageUrl } : {})
          };
        }

        const username = normalizeUsername(getTrimmedString(params.username));
        if (!username) {
          throw new Error("Username is required");
        }

        return {
          email,
          username,
          ...(displayName ? { displayName } : {}),
          ...(displayName ? { name: displayName } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(imageUrl ? { image: imageUrl } : {})
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
