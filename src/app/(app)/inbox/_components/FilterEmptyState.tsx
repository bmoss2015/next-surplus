import {
  IconMail,
  IconMessage2,
  IconCircleCheck,
  IconLink,
  IconSearch,
} from "@tabler/icons-react";
import type { InboxFilter } from "@/lib/email/types";

type Variant = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

function variantFor(filter: InboxFilter, q: string): Variant {
  if (q) {
    return {
      icon: <IconSearch size={20} stroke={1.5} />,
      title: "No Matches",
      body: `Nothing matched "${q}". Try a shorter or different term.`,
    };
  }
  switch (filter) {
    case "unread":
      return {
        icon: <IconCircleCheck size={20} stroke={1.5} />,
        title: "All Caught Up",
        body: "Nothing unread. New inbound messages will show up here automatically.",
      };
    case "email":
      return {
        icon: <IconMail size={20} stroke={1.5} />,
        title: "No Email Threads",
        body: "Once you start receiving email, threads will appear here.",
      };
    case "sms":
      return {
        icon: <IconMessage2 size={20} stroke={1.5} />,
        title: "No SMS Conversations",
        body: "SMS isn't wired up yet — once a QUO number is connected, texts will land here.",
      };
    case "unlinked":
      return {
        icon: <IconLink size={20} stroke={1.5} />,
        title: "Nothing Unlinked",
        body: "Every conversation is attached to a lead. Senders that don't match a contact will show up here.",
      };
    default:
      return {
        icon: <IconMail size={20} stroke={1.5} />,
        title: "Inbox Is Empty",
        body: "Once new messages arrive, you'll see them here. Syncs run every couple of minutes.",
      };
  }
}

export function FilterEmptyState({
  filter,
  q,
}: {
  filter: InboxFilter;
  q: string;
}) {
  const v = variantFor(filter, q);
  return (
    <div className="flex h-full flex-1 items-center justify-center bg-canvas">
      <div className="max-w-[360px] px-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
          {v.icon}
        </div>
        <div className="text-[13px] font-medium text-ink">{v.title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-gray-500">
          {v.body}
        </div>
      </div>
    </div>
  );
}
