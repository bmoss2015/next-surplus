"use client";

import { useEffect, useState, useTransition } from "react";
import {
  IconX,
  IconExternalLink,
  IconArrowBackUp,
  IconMail,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { MailStatusPill, mailStatusLabel } from "@/components/mail/MailStatusPill";
import { MailStepTimeline } from "@/components/mail/MailStepTimeline";
import type { LetterPreviewData } from "@/components/mail/LetterPreviewModal";
import { displayRecipientName } from "@/components/mail/displayName";
import type { MailJobDetailRow } from "@/lib/mail/fetch";
import { fetchMailJobAction } from "../_fetchers";
import { resendMailJob, deleteMailJob } from "../_actions";

// Slide-out detail panel that takes ~half the viewport on desktop.
// Anchors visual focus on a thumbnail of the letter (Linear-style), with
// the lifecycle timeline below and the resend form expanding inline
// when the piece was returned/failed.

const MAIL_CLASS_LABEL: Record<MailJobDetailRow["mail_class"], string> = {
  standard: "Standard",
  first_class: "First Class",
  certified: "Certified",
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MailDetailDrawer({
  jobId,
  onClose,
  onOpenLetter,
  onResent,
  onDeleted,
}: {
  jobId: string | null;
  onClose: () => void;
  onOpenLetter: (data: LetterPreviewData) => void;
  onResent: () => void;
  onDeleted: () => void;
}) {
  const [job, setJob] = useState<MailJobDetailRow | null>(null);
  // Derive "is loading" from whether the fetched job matches the current
  // jobId, so we don't need a parallel useState that triggers cascading
  // renders inside the effect.
  const loading = jobId != null && job?.id !== jobId;

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    void (async () => {
      const fetched = await fetchMailJobAction(jobId);
      if (cancelled) return;
      setJob(fetched);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jobId, onClose]);

  if (!jobId) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-surface shadow-2xl">
        {loading || !job ? (
          <div className="flex h-full items-center justify-center text-[12px] text-gray-500">
            Loading...
          </div>
        ) : (
          <DetailContent
            job={job}
            onClose={onClose}
            onOpenLetter={() =>
              onOpenLetter({
                jobId: job.id,
                recipientName: displayRecipientName(job.recipient_name),
                bodyHtml: job.body_html,
                trackingUrl: job.tracking_url,
              })
            }
            onResent={onResent}
            onDeleted={onDeleted}
          />
        )}
      </aside>
    </div>
  );
}

function DetailContent({
  job,
  onClose,
  onOpenLetter,
  onResent,
  onDeleted,
}: {
  job: MailJobDetailRow;
  onClose: () => void;
  onOpenLetter: () => void;
  onResent: () => void;
  onDeleted: () => void;
}) {
  const [deletePending, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !confirm(
        "Delete this mail record permanently? The activity entry on the lead stays as historical truth."
      )
    ) {
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteMailJob({ jobId: job.id });
      if (!res.ok) {
        setDeleteError(res.error);
        return;
      }
      onDeleted();
    });
  };
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-surface px-6 py-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
            {job.include_check ? "Check" : "Letter"} ·{" "}
            {MAIL_CLASS_LABEL[job.mail_class]}
          </div>
          <div className="truncate text-[15px] font-medium text-ink">
            {displayRecipientName(job.recipient_name)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MailStatusPill status={job.status} />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 space-y-5">
        {/* Visual anchor: letter preview thumbnail */}
        <button
          type="button"
          onClick={onOpenLetter}
          className="group block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-shadow hover:shadow-card cursor-pointer"
          title="Open Letter Preview"
        >
          <div className="relative h-80 w-full overflow-hidden bg-white">
            {job.body_html ? (
              <iframe
                title="Letter thumbnail"
                sandbox=""
                srcDoc={job.body_html}
                // Render at full letter dimensions (8.5x11 → 612x792 at 72dpi)
                // then scale down to fit. Origin top-left ensures the
                // top of the letter (date / address block / greeting) is
                // visible, not pushed off-screen.
                className="absolute left-0 top-0 origin-top-left scale-[0.46] bg-white"
                style={{ width: "612px", height: "792px" }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-gray-500">
                <IconMail size={32} stroke={1.25} className="text-gray-300" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/0 to-transparent group-hover:from-black/5" />
          </div>
          <div className="border-t border-gray-200 px-3 py-2 text-left text-[11.5px] text-gray-600 group-hover:text-petrol-700">
            Click to View Full Letter
          </div>
        </button>

        <MailStepTimeline job={job} />

        {/* Recipient + Sender + Provider details */}
        <div className="grid grid-cols-2 gap-4 text-[12.5px]">
          <DetailBlock title="Recipient">
            <div className="font-medium text-ink">{displayRecipientName(job.recipient_name)}</div>
            <div className="text-gray-600">{job.recipient_address_line1}</div>
            {job.recipient_address_line2 && (
              <div className="text-gray-600">{job.recipient_address_line2}</div>
            )}
            <div className="text-gray-600">
              {job.recipient_city}, {job.recipient_state} {job.recipient_postal_code}
            </div>
          </DetailBlock>
          <DetailBlock title="From">
            <div className="font-medium text-ink">{job.from_name}</div>
            <div className="text-gray-600">{job.from_address_line1}</div>
            {job.from_address_line2 && (
              <div className="text-gray-600">{job.from_address_line2}</div>
            )}
            <div className="text-gray-600">
              {job.from_city}, {job.from_state} {job.from_postal_code}
            </div>
          </DetailBlock>
          {job.include_check && (
            <DetailBlock title="Check">
              <div className="font-medium text-ink">
                $
                {((job.check_amount_cents ?? 0) / 100).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              {job.check_memo && (
                <div className="text-gray-600">Memo: {job.check_memo}</div>
              )}
            </DetailBlock>
          )}
          <DetailBlock title="Sent">
            <div className="text-ink">{fmtDateTime(job.sent_at)}</div>
            <div className="text-[11px] text-gray-500">
              Status: {mailStatusLabel(job.status)}
            </div>
          </DetailBlock>
        </div>

        <div className="flex items-center gap-2">
          {job.tracking_url ? (
            <a
              href={job.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-gray-50"
            >
              Track Package
              <IconExternalLink size={12} stroke={2} />
            </a>
          ) : null}
          {job.lead_id && (
            <Link
              href={`/leads/${job.lead_id}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-gray-50"
            >
              Open Lead
            </Link>
          )}
        </div>

        {(job.status === "returned" || job.status === "failed") && (
          <ResendForm job={job} onResent={onResent} onDeleted={onDeleted} />
        )}

        {/* Delete is only offered for failed pieces — those are records
            of provider rejections that may pre-date the no-persist-on-
            sync-failure change. Successful sends stay as history. */}
        {job.status === "failed" && (
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12.5px] font-medium text-ink">
                  Delete Record
                </div>
                <div className="mt-[2px] text-[11.5px] text-gray-500">
                  Permanently remove this row from the dashboard. The
                  activity entry on the lead (if any) is kept.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-danger/40 bg-white px-3 py-1.5 text-[12px] font-medium text-danger hover:bg-danger-bg/40 disabled:opacity-50"
              >
                <IconTrash size={12} stroke={2} />
                {deletePending ? "Deleting..." : "Delete"}
              </button>
            </div>
            {deleteError && (
              <div className="mt-2 text-[11.5px] text-danger">{deleteError}</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </div>
      <div className="space-y-[1px]">{children}</div>
    </div>
  );
}

function ResendForm({
  job,
  onResent,
  onDeleted,
}: {
  job: MailJobDetailRow;
  onResent: () => void;
  onDeleted: () => void;
}) {
  const [line1, setLine1] = useState(job.recipient_address_line1);
  const [line2, setLine2] = useState(job.recipient_address_line2 ?? "");
  const [city, setCity] = useState(job.recipient_city);
  const [state, setState] = useState(job.recipient_state);
  const [postal, setPostal] = useState(job.recipient_postal_code);
  const [saveToLead, setSaveToLead] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await resendMailJob({
        jobId: job.id,
        line1,
        line2: line2 || null,
        city,
        state,
        postal_code: postal,
        save_address_to_lead: saveToLead,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onResent();
    });
  };

  const cancel = () => {
    if (
      !confirm(
        "Delete this returned record without resending? Activity entry on the lead is kept; the row goes away."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteMailJob({ jobId: job.id });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDeleted();
    });
  };

  return (
    <div className="rounded-lg border border-petrol-300 bg-petrol-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <IconArrowBackUp size={14} stroke={2} className="text-petrol-700" />
        <div className="text-[12.5px] font-medium text-petrol-800">
          Update Address &amp; Resend
        </div>
      </div>
      <p className="mb-3 text-[11.5px] text-gray-700">
        The recipient&apos;s address didn&apos;t deliver. Fix it below and send
        a new piece — or, if you don&apos;t have a corrected address yet,
        delete this record. The original returned activity entry on the
        lead is kept either way.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Address Line 1" value={line1} onChange={setLine1} colSpan={2} />
        <Field label="Line 2 (optional)" value={line2} onChange={setLine2} colSpan={2} />
        <Field label="City" value={city} onChange={setCity} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="State" value={state} onChange={setState} />
          <Field label="ZIP" value={postal} onChange={setPostal} />
        </div>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-charcoal">
        <input
          type="checkbox"
          checked={saveToLead}
          onChange={(e) => setSaveToLead(e.target.checked)}
          className="cursor-pointer"
        />
        Save This Corrected Address To The Lead
      </label>
      {error && (
        <div className="mt-3 rounded-md border border-danger/40 bg-danger-bg/40 px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Don&apos;t Resend — Delete Record
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn btn-primary disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Sending..." : "Resend"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  colSpan,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colSpan?: number;
}) {
  return (
    <label
      className={`block ${colSpan === 2 ? "col-span-2" : ""}`}
    >
      <span className="block text-[10.5px] font-medium uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:ring-1 focus:ring-petrol-300"
      />
    </label>
  );
}
