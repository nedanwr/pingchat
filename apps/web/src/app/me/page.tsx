import { ConversationPane } from "~/components/chat/conversation-pane";
import { DirectMessagesPane } from "~/components/chat/direct-messages-pane";
import { ServerRail } from "~/components/chat/server-rail";

const currentUser = "You";
const activeRecipient = {
  name: "Kai"
} as const;

const servers = [
  { id: "pc", name: "Pingchat", initials: "PC", active: true },
  { id: "dn", name: "Design Notes", initials: "DN", active: false },
  { id: "be", name: "Backend", initials: "BE", active: false },
  { id: "qa", name: "QA", initials: "QA", active: false },
  { id: "mg", name: "Marketing", initials: "MG", active: false }
] as const;

const directMessages = [
  {
    id: "kai",
    name: "Kai",
    unread: 2,
    active: true
  },
  {
    id: "nora",
    name: "Nora",
    unread: 0,
    active: false
  },
  {
    id: "mina",
    name: "Mina",
    unread: 0,
    active: false
  },
  {
    id: "ari",
    name: "Ari",
    unread: 1,
    active: false
  }
] as const;

const dmMessages = [
  {
    id: "1",
    sender: "Kai",
    time: "9:41 AM",
    content: "Can we align on the server navigation spacing before lunch?"
  },
  {
    id: "2",
    sender: currentUser,
    time: "9:43 AM",
    content:
      "Yes. I can push a pass that matches auth surface spacing in 10 minutes."
  },
  {
    id: "3",
    sender: "Kai",
    time: "9:44 AM",
    content: "Perfect. Send it here when ready and I will review immediately."
  }
] as const;
const loggedInUser = {
  name: "You",
  handle: "@you",
  status: "Online"
} as const;

export default function MePage() {
  return (
    <main className="bg-background text-foreground relative h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--accent-foreground)/0.08),transparent_40%)]" />
      <div className="bg-background/55 ring-border/40 relative flex h-full w-full overflow-hidden ring-1 backdrop-blur-2xl">
        <ServerRail servers={servers} />
        <DirectMessagesPane
          conversations={directMessages}
          currentUser={loggedInUser}
        />
        <ConversationPane
          composerPlaceholder={`Send a private message to ${activeRecipient.name}`}
          messages={dmMessages}
          title={activeRecipient.name}
        />
      </div>
    </main>
  );
}
