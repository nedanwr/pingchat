"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Preloaded } from "convex/react";
import {
  useConvexConnectionState,
  useMutation,
  usePreloadedQuery
} from "convex/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from "react";

type SidebarUserStatus = "online" | "idle" | "dnd" | "invisible" | "offline";

const PRESENCE_HEARTBEAT_INTERVAL_MS = 30 * 1000;
const PRESENCE_ACTIVITY_DEBOUNCE_MS = 15 * 1000;

type SidebarUser = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  status: SidebarUserStatus;
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
  const connectionState = useConvexConnectionState();

  const value = useMemo<CurrentUserContextValue>(() => {
    if (currentUser === null) {
      return {
        user: null
      };
    }

    const name = currentUser.displayName ?? currentUser.username ?? "User";

    const handle = currentUser.username
      ? toHandle(currentUser.username)
      : "@user";

    return {
      user: {
        id: currentUser.id,
        name,
        handle,
        avatarUrl: currentUser.avatarUrl,
        status: connectionState.isWebSocketConnected
          ? currentUser.status
          : "offline"
      }
    };
  }, [connectionState.isWebSocketConnected, currentUser]);

  return (
    <CurrentUserContext.Provider value={value}>
      <CurrentUserPresenceTracker currentUserId={currentUser?.id ?? null} />
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

function CurrentUserPresenceTracker({
  currentUserId
}: {
  currentUserId: string | null;
}) {
  const pathname = usePathname();
  const connectionState = useConvexConnectionState();
  const touchCurrentUserPresence = useMutation(api.users.touchCurrentUserPresence);
  const lastActivityTouchAtRef = useRef(0);

  const markActive = useCallback(() => {
    if (!currentUserId || !connectionState.isWebSocketConnected) {
      return;
    }

    const now = Date.now();
    if (now - lastActivityTouchAtRef.current < PRESENCE_ACTIVITY_DEBOUNCE_MS) {
      return;
    }

    lastActivityTouchAtRef.current = now;
    void touchCurrentUserPresence({ isActive: true }).catch(() => {});
  }, [
    connectionState.isWebSocketConnected,
    currentUserId,
    touchCurrentUserPresence
  ]);

  const sendHeartbeat = useCallback(() => {
    if (!currentUserId || !connectionState.isWebSocketConnected) {
      return;
    }

    void touchCurrentUserPresence({ isActive: false }).catch(() => {});
  }, [
    connectionState.isWebSocketConnected,
    currentUserId,
    touchCurrentUserPresence
  ]);

  useEffect(() => {
    if (!currentUserId || !connectionState.isWebSocketConnected) {
      return;
    }

    markActive();
    const heartbeatId = window.setInterval(() => {
      sendHeartbeat();
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(heartbeatId);
    };
  }, [
    connectionState.isWebSocketConnected,
    currentUserId,
    markActive,
    sendHeartbeat
  ]);

  useEffect(() => {
    markActive();
  }, [markActive, pathname]);

  useEffect(() => {
    if (!currentUserId || !connectionState.isWebSocketConnected) {
      return;
    }

    const onActivity = () => {
      markActive();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActive();
      }
    };

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("focus", onActivity);
    window.addEventListener("online", onActivity);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("focus", onActivity);
      window.removeEventListener("online", onActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [connectionState.isWebSocketConnected, currentUserId, markActive]);

  return null;
}
