// Shared types for the email module. NO server-only imports here so this
// file can be imported by client and server components alike.

export type ChannelProvider = "gmail" | "outlook" | "quo_sms";

export type EmailAccountRow = {
  id: string;
  provider: ChannelProvider;
  address: string;
  display_name: string | null;
  status: "active" | "reauth_required" | "disabled";
  last_synced_at: string | null;
  sync_read_to_provider: boolean;
  created_at: string;
};

export type InboxThreadRow = {
  id: string;
  channel: ChannelProvider;
  subject: string | null;
  participants: { address: string; name?: string }[];
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  lead_id: string | null;
  lead_label: string | null;
  lead_address: string | null;
};

export type InboxFilter = "all" | "unread" | "email" | "sms" | "unlinked";

export type InboxFilterCounts = {
  all: number;
  unread: number;
  email: number;
  sms: number;
  unlinked: number;
};

export type ThreadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  channel: ChannelProvider;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  sent_at: string;
  is_read: boolean;
  in_reply_to: string | null;
  references_chain: string[];
  provider_message_id: string | null;
  metadata: Record<string, unknown>;
  attachments: {
    id: string;
    filename: string;
    mime_type: string | null;
    size_bytes: number | null;
    storage_path: string | null;
    is_inline: boolean;
  }[];
};

export type ThreadDetail = {
  id: string;
  subject: string | null;
  channel: ChannelProvider;
  channel_account_id: string;
  provider_thread_key: string;
  lead_id: string | null;
  lead_label: string | null;
  lead_address: string | null;
  participants: { address: string; name?: string }[];
  messages: ThreadMessage[];
};
