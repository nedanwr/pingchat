"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

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

type ServerItem = {
  id: string;
  name: string;
  initials: string;
  active: boolean;
};

type NewServerPayload = {
  name: string;
  initials: string;
};

interface ServerRailProps {
  servers: readonly ServerItem[];
  onCreateServer?: (payload: NewServerPayload) => void;
}

export function ServerRail({ servers, onCreateServer }: ServerRailProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [localServers, setLocalServers] = useState<ServerItem[]>(() => [
    ...servers
  ]);

  useEffect(() => {
    setLocalServers([...servers]);
  }, [servers]);

  const canSubmit = name.trim().length >= 2;

  return (
    <aside className="border-border/50 bg-background/35 hidden w-[3.74rem] shrink-0 flex-col items-center gap-3 border-r p-1.5 backdrop-blur-xl md:flex lg:w-[4.68rem] lg:p-3">
      {localServers.map((server) => (
        <button
          key={server.id}
          aria-label={server.name}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold shadow-black/5 backdrop-blur-md transition ${
            server.active
              ? "border-primary/70 bg-primary/85 text-primary-foreground shadow-sm"
              : "border-border/60 bg-background/35 hover:bg-accent/70"
          }`}
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
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit) {
                return;
              }
              const initials = toServerInitials(name);
              onCreateServer?.({
                name: name.trim(),
                initials
              });
              setLocalServers((prev) => [
                ...prev.map((item) => ({ ...item, active: false })),
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  initials,
                  active: true
                }
              ]);
              setOpen(false);
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

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={!canSubmit} type="submit">
                Create server
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
