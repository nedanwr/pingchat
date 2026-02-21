import { ChevronDown, Hash } from "lucide-react";

import { SidebarCurrentUserCard } from "~/components/chat/sidebar-current-user";

export interface ChannelSummary {
  id: string;
  name: string;
  type: number;
  parentId?: string;
  active?: boolean;
}

interface ChannelListPaneProps {
  serverName: string;
  channels: readonly ChannelSummary[];
  onSelectChannel?: (channelId: string) => void;
}

export function ChannelListPane({
  serverName,
  channels,
  onSelectChannel
}: ChannelListPaneProps) {
  const categories = channels.filter((channel) => channel.type === 0);
  const textChannels = channels.filter((channel) => channel.type === 1);
  const categoryIds = new Set(categories.map((category) => category.id));
  const uncategorizedTextChannels = textChannels.filter(
    (channel) =>
      !channel.parentId || !categoryIds.has(channel.parentId)
  );

  const renderTextChannel = (channel: ChannelSummary) => (
    <button
      key={channel.id}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
        channel.active
          ? "bg-accent/80 text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
      }`}
      onClick={() => {
        onSelectChannel?.(channel.id);
      }}
      type="button"
    >
      <Hash className="size-4" />
      <span className="truncate">{channel.name}</span>
    </button>
  );

  return (
    <aside className="border-border/50 bg-background/30 hidden w-[9.91rem] shrink-0 border-r p-3 backdrop-blur-xl md:block md:w-[13.22rem] md:p-4 lg:w-[14.87rem]">
      <div className="relative flex h-full min-h-0 flex-col">
        <div className="border-border/50 group -mx-3 -mt-3 flex h-[2.8125rem] items-center justify-between border-b px-3 md:-mx-4 md:-mt-4 md:px-4">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {serverName}
          </h2>
          <ChevronDown className="text-muted-foreground/80 size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-3 pb-28">
          {categories.map((category) => {
            const childChannels = textChannels.filter(
              (channel) => channel.parentId === category.id
            );

            return (
              <div key={category.id} className="space-y-1">
                <p className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wide">
                  {category.name}
                </p>
                {childChannels.map(renderTextChannel)}
              </div>
            );
          })}

          {uncategorizedTextChannels.length > 0 ? (
            <div className="space-y-1">
              <p className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wide">
                Channels
              </p>
              {uncategorizedTextChannels.map(renderTextChannel)}
            </div>
          ) : null}
        </div>

        <div className="absolute right-0 bottom-0 left-0">
          <SidebarCurrentUserCard />
        </div>
      </div>
    </aside>
  );
}
