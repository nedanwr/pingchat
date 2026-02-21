"use client";

import { Settings } from "lucide-react";

import { useCurrentSidebarUser } from "~/integrations/convex/current-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SidebarCurrentUserProps {
  className?: string;
}

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

export function SidebarCurrentUserCard({ className }: SidebarCurrentUserProps) {
  const { user } = useCurrentSidebarUser();

  const fallbackUser = {
    name: "You",
    handle: "@you"
  };
  const resolvedUser = user ?? fallbackUser;

  return (
    <div className="border-border/50 -mx-3 mt-2.5 border-t px-2 pt-3 sm:-mx-4 sm:px-3">
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-1.5 py-1",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="border-border/60 bg-background/40 size-8 shrink-0 border">
            {user ? (
              <AvatarImage
                alt={`${resolvedUser.name} profile picture`}
                src={user.avatarUrl}
              />
            ) : null}
            <AvatarFallback>{avatarFallback(resolvedUser.name)}</AvatarFallback>
          </Avatar>
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
