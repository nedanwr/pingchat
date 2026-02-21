"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type SidebarUser = {
  name: string;
  handle: string;
  avatarUrl: string;
};

type CurrentUserContextValue = {
  user: SidebarUser | null;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);
type CurrentUserProviderProps = {
  children: ReactNode;
  preloadedCurrentUser: Preloaded<typeof api.users.getCurrentUser>;
};

function toHandle(value: string) {
  return `@${value.toLowerCase().replace(/^@+/, "")}`;
}

export function CurrentUserProvider({
  children,
  preloadedCurrentUser
}: CurrentUserProviderProps) {
  const currentUser = usePreloadedQuery(preloadedCurrentUser);

  const value = useMemo<CurrentUserContextValue>(() => {
    if (currentUser === null) {
      return {
        user: null
      };
    }

    const emailPrefix = currentUser.email?.split("@")[0] ?? null;
    const name =
      currentUser.displayName ?? currentUser.username ?? emailPrefix ?? "User";

    const handle = currentUser.username
      ? toHandle(currentUser.username)
      : emailPrefix
        ? toHandle(emailPrefix)
        : "@user";

    return {
      user: {
        name,
        handle,
        avatarUrl: currentUser.avatarUrl
      }
    };
  }, [currentUser]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentSidebarUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error(
      "useCurrentSidebarUser must be used within CurrentUserProvider"
    );
  }
  return context;
}
