import {
  fetchInboxThreads,
  type InboxThreadRow,
} from "@/lib/email/inbox";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { fetchLeadParties, LEAD_PARTY_ROLE_LABELS } from "@/lib/leads/lead-parties";
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
  cc_addresses: string[];
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  sent_at: string;
  in_reply_to: string | null;
  references_chain: string[];
  provider_message_id: string | null;
  provider_thread_key: string;
  channel_account_id: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  attachments: {
    id: string;
    filename: string;
    mime_type: string | null;
    storage_path: string | null;
    size_bytes: number | null;
    is_inline: boolean;
  }[];
};

// People who are *of the lead* (not the user themselves) and reachable by
// email or phone. Used to populate the Conversation tab's contact filter.
export type LeadPerson = {
  id: string;
  role: string; // human label: "Owner" / "Sister" / "Owner's Attorney" / etc.
  name: string;
  emails: string[];
  phones: string[];
};

export async function ConversationTab({ leadId }: { leadId: string }) {
  const sb = await createClient();

  const [threads, accounts, messagesRaw, owners, relatives, parties, attorneyRow] =
    await Promise.all([
      fetchInboxThreads({ leadId, limit: 50 }),
      fetchMyEmailAccounts(),
      sb
        .from("messages")
        .select(
          `id, conversation_id, channel, direction, from_address, from_name,
           to_addresses, cc_addresses, body_text, body_html, snippet, sent_at,
           in_reply_to, references_chain, provider_message_id, metadata, is_read,
           conversations!inner ( lead_id, subject, provider_thread_key, channel_account_id ),
           message_attachments ( id, filename, mime_type, storage_path, size_bytes, is_inline )`
        )
        .eq("conversations.lead_id", leadId)
        .order("sent_at", { ascending: true })
        .limit(500),
      sb
        .from("owners")
        .select(
          `id, full_name, is_primary,
           contacts ( channel, value )`
        )
        .eq("lead_id", leadId),
      sb
        .from("relatives")
        .select("id, full_name, relationship, email, phone")
        .eq("lead_id", leadId),
      fetchLeadParties(leadId),
      sb
        .from("leads")
        .select("attorney_id, attorneys ( name, email )")
        .eq("id", leadId)
        .maybeSingle(),
    ]);

  const messages: LeadConversationMessage[] = ((messagesRaw.data ?? []) as unknown[]).map(
    (m) => {
      const r = m as Record<string, unknown>;
      const conv = r.conversations as
        | {
            subject?: string | null;
            provider_thread_key?: string;
            channel_account_id?: string;
          }
        | {
            subject?: string | null;
            provider_thread_key?: string;
            channel_account_id?: string;
          }[]
        | null;
      const convObj = Array.isArray(conv) ? conv[0] : conv;
      return {
        id: r.id as string,
        conversation_id: r.conversation_id as string,
        conversation_subject: (convObj?.subject as string | null) ?? null,
        provider_thread_key: (convObj?.provider_thread_key as string) ?? "",
        channel_account_id: (convObj?.channel_account_id as string) ?? "",
        channel: r.channel as LeadConversationMessage["channel"],
        direction: r.direction as LeadConversationMessage["direction"],
        from_address: r.from_address as string,
        from_name: (r.from_name as string | null) ?? null,
        to_addresses: (r.to_addresses as string[]) ?? [],
        cc_addresses: (r.cc_addresses as string[]) ?? [],
        body_text: (r.body_text as string | null) ?? null,
        body_html: (r.body_html as string | null) ?? null,
        snippet: (r.snippet as string | null) ?? null,
        sent_at: r.sent_at as string,
        in_reply_to: (r.in_reply_to as string | null) ?? null,
        references_chain: (r.references_chain as string[]) ?? [],
        provider_message_id: (r.provider_message_id as string | null) ?? null,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        is_read: (r.is_read as boolean) ?? true,
        attachments:
          ((r.message_attachments as LeadConversationMessage["attachments"]) ??
            []),
      };
    }
  );

  // Build the named-people list. Each person carries the emails + phones we'll
  // match against message.from_address / to_addresses for filtering.
  const people: LeadPerson[] = [];

  // Owners + their contacts.
  for (const o of (owners.data ?? []) as unknown[]) {
    const row = o as {
      id: string;
      full_name: string;
      is_primary: boolean;
      contacts?: { channel: string; value: string }[];
    };
    const emails = (row.contacts ?? [])
      .filter((c) => c.channel === "email")
      .map((c) => c.value.toLowerCase());
    const phones = (row.contacts ?? [])
      .filter((c) => c.channel === "phone")
      .map((c) => c.value);
    people.push({
      id: `owner-${row.id}`,
      role: row.is_primary ? "Primary Owner" : "Owner",
      name: row.full_name,
      emails,
      phones,
    });
  }

  // Relatives.
  for (const r of (relatives.data ?? []) as unknown[]) {
    const row = r as {
      id: string;
      full_name: string;
      relationship: string | null;
      email: string | null;
      phone: string | null;
    };
    people.push({
      id: `relative-${row.id}`,
      role: row.relationship ?? "Relative",
      name: row.full_name,
      emails: row.email ? [row.email.toLowerCase()] : [],
      phones: row.phone ? [row.phone] : [],
    });
  }

  // Other contacts (lead_parties).
  for (const p of parties) {
    people.push({
      id: `party-${p.id}`,
      role:
        p.role === "other" && p.custom_role_label
          ? p.custom_role_label
          : LEAD_PARTY_ROLE_LABELS[p.role],
      name: p.name,
      emails: p.email ? [p.email.toLowerCase()] : [],
      phones: p.phone ? [p.phone] : [],
    });
  }

  // Moss's attorney for this case — surfaced too, since they may email about
  // the lead and we still want a quick filter.
  const attorney =
    (attorneyRow.data as { attorney_id: string | null; attorneys?: { name: string; email: string | null } | { name: string; email: string | null }[] | null } | null);
  if (attorney?.attorneys) {
    const atty = Array.isArray(attorney.attorneys)
      ? attorney.attorneys[0]
      : attorney.attorneys;
    if (atty) {
      people.push({
        id: `attorney-${attorney.attorney_id ?? ""}`,
        role: "Moss's Attorney",
        name: atty.name,
        emails: atty.email ? [atty.email.toLowerCase()] : [],
        phones: [],
      });
    }
  }

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
      people={people}
    />
  );
}

export type LeadConversationThread = InboxThreadRow;
