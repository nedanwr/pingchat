"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery } from "convex/react";
import { Plus, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLastAccessedChannelStore } from "~/stores/last-accessed-channel-store";

type ServerItem = {
  id: string;
  name: string;
  initials: string;
  targetChannelId: string | null;
  active: boolean;
};

type ServerRailProps = {
  preloadedServers: Preloaded<typeof api.servers.listServers>;
};

export function ServerRail({ preloadedServers }: ServerRailProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const servers = usePreloadedQuery(preloadedServers);
  const createServer = useMutation(api.servers.createServer);
  const activeServerId = getActiveGuildIdFromPath(pathname);
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const lastChannelByGuildId = useLastAccessedChannelStore(
    (state) => state.lastChannelByGuildId
  );
  const setLastAccessedChannel = useLastAccessedChannelStore(
    (state) => state.setLastAccessedChannel
  );
  const seedLastAccessedChannels = useLastAccessedChannelStore(
    (state) => state.seedLastAccessedChannels
  );

  const serverItems: ServerItem[] = servers.map((server) => ({
    id: server._id,
    name: server.name,
    initials: toServerInitials(server.name),
    targetChannelId:
      lastChannelByGuildId[server._id] ?? server.defaultChannelId,
    active: activeServerId ? server._id === activeServerId : false
  }));

  const canSubmit = name.trim().length >= 2;
  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutesRef.current.has(route)) {
        return;
      }
      prefetchedRoutesRef.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  useEffect(() => {
    const defaultChannelsByGuildId = Object.fromEntries(
      servers.flatMap((server) =>
        server.defaultChannelId
          ? [[server._id, server.defaultChannelId] as const]
          : []
      )
    );

    if (Object.keys(defaultChannelsByGuildId).length === 0) {
      return;
    }

    seedLastAccessedChannels(defaultChannelsByGuildId);
  }, [seedLastAccessedChannels, servers]);

  useEffect(() => {
    const routesToPrefetch = [
      "/me",
      ...serverItems
        .map((server) =>
          server.targetChannelId
            ? `/${server.id}/channels/${server.targetChannelId}`
            : null
        )
        .filter((route): route is string => route !== null)
    ];

    return runWhenIdle(() => {
      for (const route of routesToPrefetch) {
        prefetchRoute(route);
      }
    });
  }, [prefetchRoute, serverItems]);

  return (
    <aside className="border-border/50 bg-background/35 hidden w-[3.74rem] shrink-0 flex-col items-center gap-3 border-r p-1.5 backdrop-blur-xl md:flex lg:w-[4.68rem] lg:p-3">
      <button
        aria-label="Direct messages"
        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold shadow-black/5 backdrop-blur-md transition ${
          activeServerId === null
            ? "border-primary/70 bg-primary/85 text-primary-foreground shadow-sm"
            : "border-border/60 bg-background/35 hover:bg-accent/70"
        }`}
        onClick={() => {
          router.push("/me");
        }}
        onFocus={() => {
          prefetchRoute("/me");
        }}
        onMouseEnter={() => {
          prefetchRoute("/me");
        }}
        type="button"
      >
        <Users className="size-4" />
      </button>

      {serverItems.map((server) => (
        <button
          key={server.id}
          aria-label={server.name}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold shadow-black/5 backdrop-blur-md transition ${
            server.active
              ? "border-primary/70 bg-primary/85 text-primary-foreground shadow-sm"
              : "border-border/60 bg-background/35 hover:bg-accent/70"
          }`}
          onClick={() => {
            if (!server.targetChannelId) {
              return;
            }
            setLastAccessedChannel(server.id, server.targetChannelId);
            router.push(`/${server.id}/channels/${server.targetChannelId}`);
          }}
          onFocus={() => {
            if (!server.targetChannelId) {
              return;
            }
            prefetchRoute(`/${server.id}/channels/${server.targetChannelId}`);
          }}
          onMouseEnter={() => {
            if (!server.targetChannelId) {
              return;
            }
            prefetchRoute(`/${server.id}/channels/${server.targetChannelId}`);
          }}
          type="button"
        >
          {server.initials}
        </button>
      ))}

      <Dialog
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setName("");
            setCreateError(null);
          }
        }}
        open={open}
      >
        <DialogTrigger asChild>
          <Button
            className="mt-auto size-10"
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <Plus />
            <span className="sr-only">Create server</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[28.8rem]">
          <DialogHeader>
            <DialogTitle>Create Server</DialogTitle>
            <DialogDescription>
              Create a server for your friends to hang out, chat, and jump into
              shared channels.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!canSubmit || isCreating) {
                return;
              }
              const trimmedName = name.trim();
              setCreateError(null);
              setIsCreating(true);
              try {
                const createdServer = await createServer({
                  name: trimmedName
                });
                if (createdServer.defaultChannelId) {
                  setLastAccessedChannel(
                    createdServer.server._id,
                    createdServer.defaultChannelId
                  );
                  router.push(
                    `/${createdServer.server._id}/channels/${createdServer.defaultChannelId}`
                  );
                } else {
                  router.push("/me");
                }
                setOpen(false);
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to create server";
                setCreateError(message);
              } finally {
                setIsCreating(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="server-name">
                Server name <span className="text-destructive">*</span>
              </Label>
              <Input
                autoFocus
                id="server-name"
                maxLength={48}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                placeholder="Frontend Guild"
                value={name}
              />
            </div>

            {createError ? (
              <p className="text-destructive text-sm">{createError}</p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isCreating} type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={!canSubmit || isCreating} type="submit">
                {isCreating ? "Creating..." : "Create server"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function toServerInitials(name: string) {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .slice(0, 3)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase();
  }

  const alnum = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return alnum.slice(0, 3) || "SV";
}

function getActiveGuildIdFromPath(pathname: string) {
  const match = /^\/([^/]+)\/channels\/[^/]+$/.exec(pathname);
  return match?.[1] ?? null;
}

function runWhenIdle(callback: () => void) {
  if (typeof globalThis.window === "undefined") {
    return () => undefined;
  }

  const idleCallbacks = globalThis as typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (
    typeof idleCallbacks.requestIdleCallback === "function" &&
    typeof idleCallbacks.cancelIdleCallback === "function"
  ) {
    const idleCallbackId = idleCallbacks.requestIdleCallback(() => {
      callback();
    });
    return () => {
      idleCallbacks.cancelIdleCallback?.(idleCallbackId);
    };
  }

  const timeoutId = globalThis.setTimeout(() => {
    callback();
  }, 120);

  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}
