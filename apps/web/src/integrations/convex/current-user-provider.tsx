"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import { useQuery } from "convex/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type SidebarUser = {
  name: string;
  handle: string;
  avatarSeed: string;
  imageUrl: string | null;
};

type CurrentUserContextValue = {
  user: SidebarUser | null;
  isLoading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);
const NO_ARGS: Record<string, never> = {};

function toHandle(value: string) {
  return `@${value.toLowerCase().replace(/^@+/, "")}`;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const currentUser = useQuery(api.users.getCurrentUser, NO_ARGS);

  const value = useMemo<CurrentUserContextValue>(() => {
    if (currentUser === undefined) {
      return {
        user: null,
        isLoading: true
      };
    }

    if (currentUser === null) {
      return {
        user: null,
        isLoading: false
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
        avatarSeed: currentUser.username ?? currentUser.email ?? name,
        imageUrl: currentUser.imageUrl
      },
      isLoading: false
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
