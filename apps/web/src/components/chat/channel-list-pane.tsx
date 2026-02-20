import { Hash } from "lucide-react";

import {
  SidebarCurrentUserCard,
  type SidebarCurrentUser
} from "~/components/chat/sidebar-current-user";

export interface ChannelSummary {
  id: string;
  name: string;
  active?: boolean;
}

interface ChannelListPaneProps {
  serverName: string;
  channels: readonly ChannelSummary[];
  currentUser: SidebarCurrentUser;
}

export function ChannelListPane({
  serverName,
  channels,
  currentUser
}: ChannelListPaneProps) {
  return (
    <aside className="border-border/50 bg-background/30 hidden w-[10.8rem] shrink-0 border-r p-3 backdrop-blur-xl md:block md:w-[14.4rem] md:p-4 lg:w-[16.2rem]">
      <div className="relative flex h-full min-h-0 flex-col">
        <div className="mb-4">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {serverName}
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-28">
          {channels.map((channel) => (
            <button
              key={channel.id}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                channel.active
                  ? "bg-accent/80 text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
              }`}
              type="button"
            >
              <Hash className="size-4" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        <div className="absolute right-0 bottom-0 left-0">
          <SidebarCurrentUserCard user={currentUser} />
        </div>
      </div>
    </aside>
  );
}
