import {
  fetchInboxThreads,
  type InboxThreadRow,
} from "@/lib/email/inbox";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { createClient } from "@/lib/supabase/server";
import { ConversationTabClient } from "./ConversationTabClient";

export type LeadConversationMessage = {
  id: string;
  conversation_id: string;
  conversation_subject: string | null;
  channel: "gmail" | "outlook" | "quo_sms";
  direction: "inbound" | "outbound";
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  sent_at: string;
  attachments: {
    id: string;
    filename: string;
    storage_path: string | null;
    size_bytes: number | null;
    is_inline: boolean;
  }[];
};

export async function ConversationTab({ leadId }: { leadId: string }) {
  const sb = await createClient();

  // Two queries: the threads for the threads-view, and a flat message stream
  // for the activity-view. Both are RLS-scoped automatically.
  const [threads, accounts, messagesRaw] = await Promise.all([
    fetchInboxThreads({ leadId, limit: 50 }),
    fetchMyEmailAccounts(),
    sb
      .from("messages")
      .select(
        `id, conversation_id, channel, direction, from_address, from_name,
         to_addresses, body_text, body_html, snippet, sent_at,
         conversations!inner ( lead_id, subject ),
         message_attachments ( id, filename, storage_path, size_bytes, is_inline )`
      )
      .eq("conversations.lead_id", leadId)
      .order("sent_at", { ascending: true })
      .limit(500),
  ]);

  const messages: LeadConversationMessage[] = ((messagesRaw.data ?? []) as unknown[]).map(
    (m) => {
      const r = m as Record<string, unknown>;
      return {
        id: r.id as string,
        conversation_id: r.conversation_id as string,
        conversation_subject:
          ((r.conversations as { subject?: string | null } | null)?.subject as
            | string
            | null) ?? null,
        channel: r.channel as LeadConversationMessage["channel"],
        direction: r.direction as LeadConversationMessage["direction"],
        from_address: r.from_address as string,
        from_name: (r.from_name as string | null) ?? null,
        to_addresses: (r.to_addresses as string[]) ?? [],
        body_text: (r.body_text as string | null) ?? null,
        body_html: (r.body_html as string | null) ?? null,
        snippet: (r.snippet as string | null) ?? null,
        sent_at: r.sent_at as string,
        attachments:
          ((r.message_attachments as LeadConversationMessage["attachments"]) ??
            []),
      };
    }
  );

  return (
    <ConversationTabClient
      leadId={leadId}
      threads={threads}
      messages={messages}
      accounts={accounts.map((a) => ({
        id: a.id,
        address: a.address,
        display_name: a.display_name,
      }))}
    />
  );
}

export type LeadConversationThread = InboxThreadRow;
