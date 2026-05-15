"use client";

import { useState, useTransition } from "react";
import { IconSend, IconX } from "@tabler/icons-react";
import type { ThreadDetail, ThreadMessage } from "@/lib/email/types";
import { sendEmail } from "../_send-actions";

type Props =
  | {
      mode: "reply";
      replyTo: ThreadMessage;
      thread: ThreadDetail;
      accountAddress: string;
      onClose: () => void;
    }
  | {
      mode: "new";
      accountId: string;
      accountAddress: string;
      defaultTo?: string;
      defaultLeadId?: string | null;
      onClose: () => void;
    };

export function ComposeBox(props: Props) {
  const isReply = props.mode === "reply";

  const initialTo = isReply
    ? props.replyTo.direction === "inbound"
      ? props.replyTo.from_address
      : props.replyTo.to_addresses[0] ?? ""
    : props.defaultTo ?? "";
  const initialSubject = isReply
    ? props.replyTo.subject?.startsWith("Re:")
      ? props.replyTo.subject
      : `Re: ${props.replyTo.subject ?? ""}`
    : "";

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const accountId = isReply
        ? props.thread.channel_account_id
        : props.accountId;
      const result = await sendEmail({
        accountId,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        cc: cc.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        body,
        threadId: isReply ? messageThreadId(props.replyTo, props.thread) : undefined,
        inReplyTo: isReply ? messageIdHeader(props.replyTo) : null,
        referencesChain: isReply ? referencesChain(props.replyTo) : undefined,
        leadId: isReply
          ? props.thread.lead_id
          : props.defaultLeadId ?? null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      props.onClose();
      // Refresh to pick up the new message.
      window.location.reload();
    });
  }

  return (
    <div className="border-t border-gray-200 bg-surface px-6 py-3">
      <div className="flex items-center justify-between pb-2">
        <div className="text-[11px] font-medium text-gray-500">
          {isReply ? "Reply" : "New Email"} · From {props.accountAddress}
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="text-gray-400 hover:text-ink"
          aria-label="Close"
        >
          <IconX size={14} stroke={1.75} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="w-[40px] shrink-0 text-[11px] text-gray-500">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="comma-separated"
            className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] outline-none focus:border-petrol-500"
          />
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-[11px] text-petrol-500 hover:text-petrol-700"
            >
              Cc
            </button>
          )}
        </div>
        {showCc && (
          <div className="flex items-center gap-2">
            <label className="w-[40px] shrink-0 text-[11px] text-gray-500">Cc</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="comma-separated"
              className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] outline-none focus:border-petrol-500"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="w-[40px] shrink-0 text-[11px] text-gray-500">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] outline-none focus:border-petrol-500"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Write your message…"
          className="rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-petrol-500"
        />
        {error && (
          <div className="rounded-md bg-danger-bg px-2 py-1 text-[11px] text-danger">
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={send}
            disabled={pending || !to.trim() || !body.trim()}
            className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
          >
            <IconSend size={13} stroke={2} />
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function messageThreadId(
  reply: ThreadMessage,
  thread: ThreadDetail
): string | undefined {
  // We don't have the gmail thread_id on the message row directly, but the
  // conversation's provider_thread_key IS that id. Since we always send within
  // an existing thread, we fall back to undefined for safety (gmail will
  // create a new thread, which the next sync will reconcile).
  const meta = reply.metadata as { provider_thread_id?: string } | undefined;
  // try the metadata key from the local row first
  if (meta?.provider_thread_id) return meta.provider_thread_id;
  // ThreadDetail.id is our internal uuid, not gmail's — we need provider_thread_key
  // which the page fetch doesn't currently include. Use sentinel below.
  return (thread as ThreadDetail & { provider_thread_key?: string })
    .provider_thread_key;
}

function messageIdHeader(message: ThreadMessage): string | null {
  const meta = message.metadata as { message_id_header?: string } | undefined;
  return meta?.message_id_header ?? null;
}

function referencesChain(message: ThreadMessage): string[] {
  const existing = message.references_chain ?? [];
  const meta = message.metadata as { message_id_header?: string } | undefined;
  if (meta?.message_id_header) return [...existing, meta.message_id_header];
  return existing;
}
