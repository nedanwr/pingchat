import { ConversationPane } from "~/components/chat/conversation-pane";
import { DirectMessagesPane } from "~/components/chat/direct-messages-pane";

const currentUser = "You";
const currentUserAvatarUrl = "https://i.pravatar.cc/80?img=12";
const activeRecipient = {
  name: "Kai"
} as const;
const activeRecipientAvatarUrl = "https://i.pravatar.cc/80?img=14";

const directMessages = [
  {
    id: "kai",
    name: "Kai",
    avatarUrl: "https://i.pravatar.cc/80?img=14",
    unread: 2,
    active: true
  },
  {
    id: "nora",
    name: "Nora",
    avatarUrl: "https://i.pravatar.cc/80?img=23",
    unread: 0,
    active: false
  },
  {
    id: "mina",
    name: "Mina",
    avatarUrl: "https://i.pravatar.cc/80?img=32",
    unread: 0,
    active: false
  },
  {
    id: "ari",
    name: "Ari",
    avatarUrl: "https://i.pravatar.cc/80?img=41",
    unread: 1,
    active: false
  }
] as const;

const dmMessages = [
  {
    id: "1",
    sender: "Kai",
    avatarUrl: activeRecipientAvatarUrl,
    time: "9:41 AM",
    content: "Can we align on the server navigation spacing before lunch?"
  },
  {
    id: "2",
    sender: currentUser,
    avatarUrl: currentUserAvatarUrl,
    time: "9:43 AM",
    content:
      "Yes. I can push a pass that matches auth surface spacing in 10 minutes."
  },
  {
    id: "3",
    sender: "Kai",
    avatarUrl: activeRecipientAvatarUrl,
    time: "9:44 AM",
    content: "Perfect. Send it here when ready and I will review immediately."
  }
] as const;

export default function MePage() {
  return (
    <>
      <DirectMessagesPane conversations={directMessages} />
      <ConversationPane
        composerPlaceholder={`Send a private message to ${activeRecipient.name}`}
        messages={dmMessages}
        title={activeRecipient.name}
      />
    </>
  );
}
