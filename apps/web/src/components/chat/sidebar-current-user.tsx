"use client";

import { Settings } from "lucide-react";

import { useCurrentSidebarUser } from "~/integrations/convex/current-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SidebarCurrentUserProps {
  className?: string;
}

type SidebarStatus = "online" | "idle" | "dnd" | "invisible" | "offline";

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

function statusColorClass(status: SidebarStatus) {
  if (status === "online") {
    return "bg-emerald-500";
  }
  if (status === "idle") {
    return "bg-amber-500";
  }
  if (status === "dnd") {
    return "bg-rose-500";
  }
  return "bg-zinc-500";
}

function formatStatusLabel(status: SidebarStatus) {
  if (status === "dnd") {
    return "Do Not Disturb";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function SidebarCurrentUserCard({ className }: SidebarCurrentUserProps) {
  const { user } = useCurrentSidebarUser();

  const fallbackUser = {
    name: "You",
    handle: "@you",
    status: "offline" as const
  };
  const resolvedUser = user ?? fallbackUser;
  const status = resolvedUser.status;
  const statusLabel = formatStatusLabel(status);

  return (
    <div className="border-border/50 -mx-3 mt-[0.4375rem] border-t px-2 pt-[0.4375rem] sm:-mx-4 sm:px-3">
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-1.5 py-0.5",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative shrink-0">
            <Avatar className="border-border/60 bg-background/40 size-8 border">
              {user ? (
                <AvatarImage
                  alt={`${resolvedUser.name} profile picture`}
                  src={user.avatarUrl}
                />
              ) : null}
              <AvatarFallback>{avatarFallback(resolvedUser.name)}</AvatarFallback>
            </Avatar>
            <span
              aria-label={`Status: ${statusLabel}`}
              className={cn(
                "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-[hsl(var(--background))]",
                statusColorClass(status)
              )}
              role="status"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{resolvedUser.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {resolvedUser.handle}
            </p>
          </div>
        </div>
        <Button size="icon-sm" type="button" variant="ghost">
          <Settings className="size-4.5" />
          <span className="sr-only">Open settings</span>
        </Button>
      </div>
    </div>
  );
}
