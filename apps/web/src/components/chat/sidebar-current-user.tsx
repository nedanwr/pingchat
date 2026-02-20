import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

export interface SidebarCurrentUser {
  name: string;
  handle: string;
  status?: string;
  avatarSeed?: string;
}

interface SidebarCurrentUserProps {
  user: SidebarCurrentUser;
  className?: string;
}

function avatarSrc(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

export function SidebarCurrentUserCard({
  user,
  className
}: SidebarCurrentUserProps) {
  const avatarSeed = user.avatarSeed ?? user.name;

  return (
    <div className="border-border/50 -mx-3 border-t px-3 pt-5 sm:-mx-4 sm:px-4">
      <div className={cn("flex items-center gap-2 p-2", className)}>
        <Avatar className="border-border/60 bg-background/40 size-8 shrink-0 border">
          <AvatarImage
            alt={`${user.name} profile picture`}
            src={avatarSrc(avatarSeed)}
          />
          <AvatarFallback>{avatarFallback(avatarSeed)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user.handle}
            {user.status ? ` · ${user.status}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
