import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";

import {
  SidebarCurrentUserCard,
  type SidebarCurrentUser
} from "~/components/chat/sidebar-current-user";

export interface DirectMessageSummary {
  id: string;
  name: string;
  unread: number;
  active: boolean;
  avatarSeed?: string;
}

interface DirectMessagesPaneProps {
  conversations: readonly DirectMessageSummary[];
  currentUser: SidebarCurrentUser;
}

function avatarSrc(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

export function DirectMessagesPane({
  conversations,
  currentUser
}: DirectMessagesPaneProps) {
  return (
    <aside className="border-border/50 bg-background/30 w-[10.8rem] shrink-0 border-r p-3 backdrop-blur-xl sm:w-[14.4rem] sm:p-4 lg:w-[16.2rem]">
      <div className="relative flex h-full min-h-0 flex-col">
        <div className="mb-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Direct Messages
          </h2>
        </div>

        <Input
          className="border-border/50 bg-background/45 mb-4 backdrop-blur-sm"
          placeholder="Search conversations"
        />

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-28">
          {conversations.map((dm) => {
            const avatarSeed = dm.avatarSeed ?? dm.name;

            return (
              <button
                key={dm.id}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition ${
                  dm.active
                    ? "bg-accent/80 text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                }`}
                type="button"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="border-border/60 bg-background/40 size-7 shrink-0 border">
                    <AvatarImage
                      alt={`${dm.name} profile picture`}
                      src={avatarSrc(avatarSeed)}
                    />
                    <AvatarFallback>
                      {avatarFallback(avatarSeed)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-sm font-medium">{dm.name}</p>
                </div>
                {dm.unread > 0 ? (
                  <span className="bg-primary text-primary-foreground inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                    {dm.unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="absolute right-0 bottom-0 left-0">
          <SidebarCurrentUserCard user={currentUser} />
        </div>
      </div>
    </aside>
  );
}
