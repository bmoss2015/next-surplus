"use client";

import { useState, useTransition } from "react";
import {
  IconArrowBackUp,
  IconArrowBackUpDouble,
  IconArrowForwardUp,
  IconMail,
  IconPaperclip,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { ThreadDetail, ThreadMessage } from "@/lib/email/types";
import { sendEmail } from "../_send-actions";

export type ComposeMode = "reply" | "replyAll" | "forward" | "new";

type Props =
  | {
      mode: "reply" | "replyAll" | "forward";
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

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildQuoted(message: ThreadMessage): string {
  const lines = [
    "",
    "",
    `On ${fmtTime(message.sent_at)}, ${message.from_name ?? message.from_address} wrote:`,
  ];
  const body =
    message.body_text ??
    (message.body_html ? stripTags(message.body_html) : message.snippet ?? "");
  for (const line of body.split("\n")) {
    lines.push(`> ${line}`);
  }
  return lines.join("\n");
}

function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function deriveInitialValues(props: Props): {
  to: string;
  cc: string;
  subject: string;
  body: string;
  showCc: boolean;
} {
  if (props.mode === "new") {
    return {
      to: props.defaultTo ?? "",
      cc: "",
      subject: "",
      body: "",
      showCc: false,
    };
  }
  const r = props.replyTo;
  const accountLc = props.accountAddress.toLowerCase();
  const isInbound = r.direction === "inbound";
  const allRecipients = new Set<string>([
    ...r.to_addresses,
    ...r.cc_addresses,
  ]);
  if (isInbound) allRecipients.delete(accountLc);
  // Reply All keeps original CCs, plus original "to" minus self.
  const replyAllTo = isInbound ? r.from_address : r.to_addresses[0] ?? "";
  const replyAllCc = Array.from(allRecipients).filter(
    (a) => a.toLowerCase() !== replyAllTo.toLowerCase()
  );

  const baseSubject = r.subject ?? "";
  if (props.mode === "forward") {
    return {
      to: "",
      cc: "",
      subject: baseSubject.startsWith("Fwd:")
        ? baseSubject
        : `Fwd: ${baseSubject}`,
      body: buildQuoted(r),
      showCc: false,
    };
  }
  if (props.mode === "replyAll") {
    return {
      to: replyAllTo,
      cc: replyAllCc.join(", "),
      subject: baseSubject.startsWith("Re:") ? baseSubject : `Re: ${baseSubject}`,
      body: "",
      showCc: replyAllCc.length > 0,
    };
  }
  // reply
  return {
    to: replyAllTo,
    cc: "",
    subject: baseSubject.startsWith("Re:") ? baseSubject : `Re: ${baseSubject}`,
    body: "",
    showCc: false,
  };
}

function modeLabel(props: Props): { icon: React.ReactNode; text: string } {
  if (props.mode === "reply")
    return {
      icon: <IconArrowBackUp size={13} stroke={2} />,
      text: `Replying to ${props.replyTo.from_name ?? props.replyTo.from_address}`,
    };
  if (props.mode === "replyAll")
    return {
      icon: <IconArrowBackUpDouble size={13} stroke={2} />,
      text: "Reply All",
    };
  if (props.mode === "forward")
    return {
      icon: <IconArrowForwardUp size={13} stroke={2} />,
      text: "Forwarding",
    };
  return { icon: <IconMail size={13} stroke={2} />, text: "New Message" };
}

export function ComposeBox(props: Props) {
  const initial = deriveInitialValues(props);
  const [to, setTo] = useState(initial.to);
  const [cc, setCc] = useState(initial.cc);
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(initial.showCc);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isReplyMode =
    props.mode === "reply" || props.mode === "replyAll" || props.mode === "forward";
  const { icon, text } = modeLabel(props);

  function send() {
    setError(null);
    startTransition(async () => {
      const accountId =
        props.mode === "new"
          ? props.accountId
          : props.thread.channel_account_id;
      const result = await sendEmail({
        accountId,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        cc: cc.split(",").map((s) => s.trim()).filter(Boolean),
        bcc: bcc.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        body,
        threadId:
          props.mode === "new" ? undefined : threadIdForSend(props),
        inReplyTo:
          props.mode === "new" ? null : messageIdHeader(props.replyTo),
        referencesChain:
          props.mode === "new" ? undefined : referencesChain(props.replyTo),
        leadId:
          props.mode === "new"
            ? props.defaultLeadId ?? null
            : props.thread.lead_id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      props.onClose();
      window.location.reload();
    });
  }

  return (
    <div className="overflow-hidden rounded-t-[10px] border-t border-x border-gray-200 bg-surface shadow-elevated">
      {/* Header strip — petrol-tinted gradient with mode label + actions */}
      <div className="flex items-center justify-between bg-gradient-to-r from-petrol-700 to-petrol-500 px-5 py-[10px]">
        <div className="inline-flex items-center gap-2 text-[12px] font-medium text-white">
          {icon}
          {text}
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="rounded p-[2px] text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Discard"
        >
          <IconX size={14} stroke={2} />
        </button>
      </div>

      {/* From banner */}
      <div className="flex items-center gap-2 border-b border-gray-150 bg-gray-50 px-5 py-[6px] text-[11px] text-gray-500">
        <span className="font-medium text-gray-700">From</span>
        <span>{props.accountAddress}</span>
      </div>

      {/* Field rows */}
      <FieldRow label="To" value={to} onChange={setTo} placeholder="email@example.com">
        <div className="flex items-center gap-2 text-[11px]">
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-petrol-500 hover:text-petrol-700"
            >
              Cc
            </button>
          )}
          {!showBcc && (
            <button
              type="button"
              onClick={() => setShowBcc(true)}
              className="text-petrol-500 hover:text-petrol-700"
            >
              Bcc
            </button>
          )}
        </div>
      </FieldRow>

      {showCc && (
        <FieldRow label="Cc" value={cc} onChange={setCc} placeholder="" />
      )}
      {showBcc && (
        <FieldRow label="Bcc" value={bcc} onChange={setBcc} placeholder="" />
      )}
      <FieldRow
        label="Subject"
        value={subject}
        onChange={setSubject}
        placeholder=""
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={props.mode === "forward" ? 12 : 8}
        placeholder="Write your message…"
        className="block w-full resize-y bg-surface px-5 py-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-gray-400"
      />

      {error && (
        <div className="border-t border-danger-border bg-danger-bg px-5 py-2 text-[11px] text-danger">
          {error}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-[10px]">
        <div className="flex items-center gap-2 text-gray-400">
          <button
            type="button"
            disabled
            title="Attachments coming soon"
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-gray-400"
          >
            <IconPaperclip size={12} stroke={1.75} />
            Attach
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={props.onClose}
            className="text-[11px] text-gray-500 hover:text-ink"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={send}
            disabled={pending || !to.trim() || !body.trim()}
            className={cn(
              "inline-flex items-center gap-[6px] rounded-md btn-primary px-4 py-[7px] text-[12px] font-medium text-white",
              "disabled:opacity-50"
            )}
          >
            <IconSend size={12} stroke={2} />
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-[6px]">
      <label className="w-[56px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-300"
      />
      {children}
    </div>
  );
}

function threadIdForSend(
  props: Extract<Props, { mode: "reply" | "replyAll" | "forward" }>
): string | undefined {
  // Forwards start a new thread per email convention — drop the threadId so
  // Gmail allocates a fresh one. Replies stay in the existing thread.
  if (props.mode === "forward") return undefined;
  return props.thread.provider_thread_key;
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
