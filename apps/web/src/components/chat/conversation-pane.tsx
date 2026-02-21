import type { ReactNode } from "react";
import { Gift, Plus, Smile, Sparkles, Sticker } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type ConversationMessage = {
  id: string;
  sender: string;
  time: string;
  content: string;
  avatarUrl: string;
};

interface ConversationPaneProps {
  sectionLabel?: string;
  title: ReactNode;
  headerAction?: ReactNode;
  messages: readonly ConversationMessage[];
  composerPlaceholder: string;
}

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

export function ConversationPane({
  sectionLabel,
  title,
  headerAction,
  messages,
  composerPlaceholder
}: ConversationPaneProps) {
  return (
    <section className="bg-background/20 flex min-w-0 flex-1 flex-col backdrop-blur-sm">
      <header className="border-border/50 bg-background/30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl">
        <div className="pl-2">
          {sectionLabel ? (
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {sectionLabel}
            </p>
          ) : null}
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        </div>
        {headerAction}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <article key={message.id} className="flex gap-3 rounded-xl px-2 py-2">
            <Avatar className="border-border/60 bg-background/40 size-10 shrink-0 border">
              <AvatarImage
                alt={`${message.sender} profile picture`}
                src={message.avatarUrl}
              />
              <AvatarFallback>{avatarFallback(message.sender)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-semibold">{message.sender}</p>
                <p className="text-muted-foreground text-xs">{message.time}</p>
              </div>
              <p className="text-muted-foreground pt-0.5 text-sm">
                {message.content}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="border-border/50 bg-background/30 flex h-16 items-center gap-1 border-t px-3 backdrop-blur-xl sm:px-4">
          <Button
            className="text-muted-foreground hover:text-foreground hover:bg-accent/70 size-8 rounded-xl sm:size-9"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Plus className="size-5" strokeWidth={2.75} />
            <span className="sr-only">More actions</span>
          </Button>
          <Input
            className="text-foreground placeholder:text-muted-foreground/90 h-full min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm focus-visible:border-transparent focus-visible:ring-0 sm:px-3 sm:text-base dark:bg-transparent"
            id="composer"
            placeholder={composerPlaceholder}
          />
          <div className="flex items-center justify-end gap-1 pl-2">
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 size-8 rounded-xl sm:size-9"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Gift />
              <span className="sr-only">Gift</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 h-8 rounded-xl px-2 text-[10px] font-semibold tracking-wide sm:h-9 sm:px-2.5 sm:text-xs"
              size="sm"
              type="button"
              variant="ghost"
            >
              GIF
              <span className="sr-only">Open GIF picker</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl sm:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Sticker />
              <span className="sr-only">Stickers</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl md:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Smile />
              <span className="sr-only">Emoji</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl lg:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Sparkles />
              <span className="sr-only">Effects</span>
            </Button>
          </div>
      </div>
    </section>
  );
}
