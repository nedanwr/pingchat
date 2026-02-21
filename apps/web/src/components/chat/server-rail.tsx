"use client";

import { api } from "@pingchat/convex/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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

export function ServerRail() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const servers = useQuery(api.servers.listServers) ?? [];
  const createServer = useMutation(api.servers.createServer);

  useEffect(() => {
    if (servers.length === 0) {
      setActiveServerId(null);
      return;
    }
    if (activeServerId && servers.some((server) => server._id === activeServerId)) {
      return;
    }
    setActiveServerId(servers[0]!._id);
  }, [activeServerId, servers]);

  const serverItems: ServerItem[] = servers.map((server, index) => ({
    id: server._id,
    name: server.name,
    initials: toServerInitials(server.name),
    active: activeServerId ? server._id === activeServerId : index === 0
  }));

  const canSubmit = name.trim().length >= 2;

  return (
    <aside className="border-border/50 bg-background/35 hidden w-[3.74rem] shrink-0 flex-col items-center gap-3 border-r p-1.5 backdrop-blur-xl md:flex lg:w-[4.68rem] lg:p-3">
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
            setActiveServerId(server.id);
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
                setActiveServerId(createdServer._id);
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
