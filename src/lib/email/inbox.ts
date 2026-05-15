import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  InboxThreadRow,
  InboxFilter,
  ThreadDetail,
  ThreadMessage,
} from "./types";

// Re-export so existing server-side imports keep working.
export type {
  InboxThreadRow,
  InboxFilter,
  ThreadDetail,
  ThreadMessage,
} from "./types";

export async function fetchInboxThreads(opts: {
  filter?: InboxFilter;
  q?: string;
  leadId?: string;
  limit?: number;
}): Promise<InboxThreadRow[]> {
  const sb = await createClient();
  const limit = opts.limit ?? 100;

  // We pull the conversation rows and the linked lead label in one round-trip.
  let query = sb
    .from("conversations")
    .select(
      `id, channel, subject, participants, last_message_at, last_message_preview,
       unread_count, lead_id, is_archived,
       leads ( lead_id, address, owners ( full_name, is_primary ) )`
    )
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (opts.filter === "email") query = query.eq("channel", "gmail");
  else if (opts.filter === "sms") query = query.eq("channel", "quo_sms");
  else if (opts.filter === "unread") query = query.gt("unread_count", 0);
  else if (opts.filter === "unlinked") query = query.is("lead_id", null);

  if (opts.leadId) query = query.eq("lead_id", opts.leadId);

  // Two-tier search: first the cheap subject/preview ILIKE, plus a Postgres
  // FTS pass on message body text. We union the matched conversation ids
  // and constrain the main query to that set.
  if (opts.q?.trim()) {
    const term = opts.q.trim().replace(/[%*"'(),\\]/g, "");
    if (term) {
      const tsquery = term
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" & ");
      const [ftsRes, _] = await Promise.all([
        sb
          .from("messages")
          .select("conversation_id")
          .textSearch("body_text", tsquery, {
            config: "english",
            type: "websearch",
          })
          .limit(500),
        Promise.resolve(null),
      ]);
      const fromFts = (ftsRes.data ?? []).map(
        (r) => r.conversation_id as string
      );
      const orParts: string[] = [
        `subject.ilike.%${term}%`,
        `last_message_preview.ilike.%${term}%`,
      ];
      if (fromFts.length > 0) {
        orParts.push(`id.in.(${fromFts.join(",")})`);
      }
      query = query.or(orParts.join(","));
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r) => {
    const rawLeads = (r as unknown as {
      leads?:
        | { lead_id: string; address: string; owners: { full_name: string; is_primary: boolean }[] }
        | { lead_id: string; address: string; owners: { full_name: string; is_primary: boolean }[] }[]
        | null;
    }).leads;
    const lead = Array.isArray(rawLeads) ? rawLeads[0] ?? null : rawLeads ?? null;
    const owners = lead?.owners ?? [];
    const primary = owners.find((o) => o.is_primary) ?? owners[0];
    const leadLabel = primary?.full_name ?? lead?.lead_id ?? null;
    return {
      id: r.id as string,
      channel: r.channel as InboxThreadRow["channel"],
      subject: r.subject as string | null,
      participants: ((r.participants ?? []) as InboxThreadRow["participants"]),
      last_message_at: r.last_message_at as string | null,
      last_message_preview: r.last_message_preview as string | null,
      unread_count: (r.unread_count as number) ?? 0,
      lead_id: r.lead_id as string | null,
      lead_label: leadLabel,
      lead_address: lead?.address ?? null,
    };
  });
}

export async function fetchThreadDetail(
  threadId: string
): Promise<ThreadDetail | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("conversations")
    .select(
      `id, subject, channel, channel_account_id, provider_thread_key, lead_id, participants,
       leads ( lead_id, address, owners ( full_name, is_primary ) ),
       messages ( id, direction, channel, from_address, from_name,
                  to_addresses, cc_addresses, subject, body_text, body_html,
                  snippet, sent_at, is_read, in_reply_to, references_chain,
                  provider_message_id, metadata,
                  message_attachments ( id, filename, mime_type, size_bytes,
                                        storage_path, is_inline ) )`
    )
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rawLeads = (data as unknown as {
    leads?:
      | { lead_id: string; address: string; owners: { full_name: string; is_primary: boolean }[] }
      | { lead_id: string; address: string; owners: { full_name: string; is_primary: boolean }[] }[]
      | null;
  }).leads;
  const lead = Array.isArray(rawLeads) ? rawLeads[0] ?? null : rawLeads ?? null;
  const owners = lead?.owners ?? [];
  const primary = owners.find((o) => o.is_primary) ?? owners[0];

  const messages = ((data.messages ?? []) as unknown[])
    .map((m) => {
      const row = m as ThreadMessage & {
        message_attachments?: ThreadMessage["attachments"];
      };
      return {
        id: row.id,
        direction: row.direction,
        channel: row.channel,
        from_address: row.from_address,
        from_name: row.from_name,
        to_addresses: row.to_addresses ?? [],
        cc_addresses: row.cc_addresses ?? [],
        subject: row.subject,
        body_text: row.body_text,
        body_html: row.body_html,
        snippet: row.snippet,
        sent_at: row.sent_at,
        is_read: row.is_read,
        in_reply_to: row.in_reply_to,
        references_chain: row.references_chain ?? [],
        provider_message_id: row.provider_message_id,
        metadata: row.metadata ?? {},
        attachments: row.message_attachments ?? [],
      } as ThreadMessage;
    })
    .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  return {
    id: data.id as string,
    subject: data.subject as string | null,
    channel: data.channel as ThreadDetail["channel"],
    channel_account_id: data.channel_account_id as string,
    provider_thread_key: data.provider_thread_key as string,
    lead_id: data.lead_id as string | null,
    lead_label: primary?.full_name ?? lead?.lead_id ?? null,
    lead_address: lead?.address ?? null,
    participants:
      ((data.participants ?? []) as ThreadDetail["participants"]),
    messages,
  };
}

export async function markThreadRead(threadId: string): Promise<void> {
  const sb = await createClient();
  await sb
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", threadId)
    .eq("is_read", false);
  await sb
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", threadId);
}
