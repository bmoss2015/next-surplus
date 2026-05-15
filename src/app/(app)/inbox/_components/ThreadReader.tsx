"use client";

import { useEffect, useState, useTransition } from "react";
import {
  IconMail,
  IconMessage2,
  IconPaperclip,
  IconArchive,
  IconLink,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { ThreadDetail, ThreadMessage } from "@/lib/email/types";
import { archiveThread, markThreadRead } from "../_actions";
import { ComposeBox } from "./ComposeBox";
import { HtmlMessage } from "./HtmlMessage";
import { LinkToLeadPicker } from "./LinkToLeadPicker";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ThreadReader({
  detail,
  accountAddress,
}: {
  detail: ThreadDetail;
  accountAddress: string;
}) {
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (detail.messages.some((m) => !m.is_read && m.direction === "inbound")) {
      startTransition(async () => {
        await markThreadRead(detail.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id]);

  function archive() {
    if (!confirm("Archive this thread?")) return;
    startTransition(async () => {
      await archiveThread(detail.id);
      window.location.href = "/inbox";
    });
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-canvas">
      {/* Header strip */}
      <div className="border-b border-gray-200 bg-surface px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[15px] font-medium text-ink">
              {detail.subject || "(No subject)"}
            </h2>
            <div className="mt-1 truncate text-[11px] text-gray-500">
              {detail.participants.map((p) => p.name || p.address).join(", ")}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {detail.lead_id ? (
              <a
                href={`/leads/${detail.lead_id}`}
                className="inline-flex items-center gap-1 rounded-full bg-petrol-50 px-2 py-[3px] text-[10px] font-medium text-petrol-700 hover:bg-petrol-100"
              >
                → {detail.lead_label}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setShowLinkPicker(true)}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-[3px] text-[10px] font-medium text-gray-600 hover:bg-gray-200"
              >
                <IconLink size={11} stroke={1.75} />
                Link To Lead
              </button>
            )}
            <button
              type="button"
              onClick={archive}
              className="text-gray-400 hover:text-ink"
              title="Archive"
              aria-label="Archive"
            >
              <IconArchive size={15} stroke={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3">
          {detail.messages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              accountAddress={accountAddress}
              onReply={() => setReplyTo(m)}
            />
          ))}
        </div>
      </div>

      {/* Compose / Reply */}
      {replyTo ? (
        <ComposeBox
          mode="reply"
          replyTo={replyTo}
          thread={detail}
          accountAddress={accountAddress}
          onClose={() => setReplyTo(null)}
        />
      ) : (
        <div className="flex justify-end border-t border-gray-200 bg-surface px-6 py-3">
          <button
            type="button"
            onClick={() => setReplyTo(detail.messages[detail.messages.length - 1])}
            className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconArrowBackUp size={13} stroke={2} />
            Reply
          </button>
        </div>
      )}

      {showLinkPicker && (
        <LinkToLeadPicker
          threadId={detail.id}
          onClose={() => setShowLinkPicker(false)}
        />
      )}
    </div>
  );
}

function MessageCard({
  message,
  accountAddress,
  onReply,
}: {
  message: ThreadMessage;
  accountAddress: string;
  onReply: () => void;
}) {
  const outbound = message.direction === "outbound";
  return (
    <div
      className={cn(
        "rounded-[10px] border px-4 py-3 shadow-card",
        outbound
          ? "border-petrol-100 bg-petrol-50/40"
          : "border-gray-200 bg-surface"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px]">
          {message.channel === "quo_sms" ? (
            <IconMessage2 size={12} stroke={1.75} className="text-petrol-500" />
          ) : (
            <IconMail size={12} stroke={1.75} className="text-petrol-500" />
          )}
          <span className="font-medium text-ink">
            {message.from_name || message.from_address}
          </span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">
            {message.to_addresses.join(", ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">
            {fmtTime(message.sent_at)}
          </span>
          <button
            type="button"
            onClick={onReply}
            className="text-[10px] text-petrol-500 hover:text-petrol-700"
          >
            Reply
          </button>
        </div>
      </div>
      <div className="mt-2 text-[12.5px] leading-relaxed text-ink">
        {message.body_html ? (
          <HtmlMessage html={message.body_html} />
        ) : (
          <div className="whitespace-pre-wrap">
            {message.body_text ?? message.snippet ?? ""}
          </div>
        )}
      </div>
      {message.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.attachments
            .filter((a) => !a.is_inline)
            .map((a) => (
              <AttachmentChip
                key={a.id}
                filename={a.filename}
                sizeBytes={a.size_bytes}
                storagePath={a.storage_path}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function AttachmentChip({
  filename,
  sizeBytes,
  storagePath,
}: {
  filename: string;
  sizeBytes: number | null;
  storagePath: string | null;
}) {
  const sizeLabel =
    sizeBytes != null
      ? sizeBytes < 1024
        ? `${sizeBytes} B`
        : sizeBytes < 1024 * 1024
          ? `${Math.round(sizeBytes / 1024)} KB`
          : `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
      : "";
  const downloadHref = storagePath
    ? `/api/email/attachment?path=${encodeURIComponent(storagePath)}`
    : "#";
  return (
    <a
      href={downloadHref}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500"
    >
      <IconPaperclip size={11} stroke={1.75} />
      {filename}
      {sizeLabel && <span className="text-gray-400"> · {sizeLabel}</span>}
    </a>
  );
}
