import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";

type ServerItem = {
  id: string;
  name: string;
  initials: string;
  active: boolean;
};

interface ServerRailProps {
  servers: readonly ServerItem[];
}

export function ServerRail({ servers }: ServerRailProps) {
  return (
    <aside className="border-border/50 bg-background/35 flex w-[3.74rem] shrink-0 flex-col items-center gap-3 border-r p-1.5 backdrop-blur-xl sm:w-[4.68rem] sm:p-3">
      {servers.map((server) => (
        <button
          key={server.id}
          aria-label={server.name}
          className={`flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-xl border text-xs font-semibold shadow-black/5 backdrop-blur-md transition ${
            server.active
              ? "border-primary/70 bg-primary/85 text-primary-foreground shadow-sm"
              : "border-border/60 bg-background/35 hover:bg-accent/70"
          }`}
          type="button"
        >
          {server.initials}
        </button>
      ))}

      <Button
        className="mt-auto"
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Plus />
        <span className="sr-only">Add server</span>
      </Button>
    </aside>
  );
}
