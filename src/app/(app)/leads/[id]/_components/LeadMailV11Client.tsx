"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconMail,
  IconCalendar,
  IconClock,
  IconCircleCheck,
  IconArrowBackUp,
  IconBarcode,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { displayRecipientName } from "@/components/mail/displayName";
import type { MailJobListRow, MailJobDetailRow } from "@/lib/mail/fetch";
import { fetchMailJobAction } from "@/app/(app)/mail/_fetchers";
import {
  SendMailModal,
  type SendMailModalRecipient,
} from "@/components/mail/SendMailModal";
import type { SendMailFromAddress } from "@/components/mail/SendMailButton";
import type { MailTemplateRow } from "@/lib/settings/fetch";

// V11 — lead Mail tab. Stats header on top, split-pane below.
// Left rail: compact list of pieces with status dot + name + sent
// date, selected row gets a 3px green vertical inset-shadow. Right
// pane: portrait letter thumbnail on the left, meta + actions on
// the right (V2 content inside V4's split-pane). Sized so the letter
// reads as an 8.5x11 sheet, not a landscape strip.
//
// Mounts its own SendMailModal so both the "Send Mail" header button
// and per-piece Fix & Resend buttons can open the compose flow without
// hopping to the Contacts tab. Auto-opens when ?resend=<piece_id> is
// in the URL (used by /mail's Fix & Resend button to deep-link in).

const STATUS_DOT: Record<string, string> = {
  queued: "bg-gray-400",
  in_transit: "bg-gray-400",
  delivered: "bg-petrol-500",
  returned: "bg-danger",
  failed: "bg-danger",
};

function mailClassLabel(mc: MailJobListRow["mail_class"]): string {
  if (mc === "standard") return "Standard";
  if (mc === "certified") return "Certified";
  return "First Class";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateCompact(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Best-effort match between a returned piece and an existing candidate.
// We pick by (line1 + city + state) since the recipient may have several
// rows under the same name. Returns the candidate key if a match exists.
function findCandidateKeyForPiece(
  piece: MailJobListRow,
  candidates: SendMailModalRecipient[]
): string | null {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, " ");
  const pLine1 = normalize(piece.recipient_address_line1);
  const pCity = normalize(piece.recipient_city);
  const pState = normalize(piece.recipient_state);
  for (const c of candidates) {
    if (
      normalize(c.contact.line1) === pLine1 &&
      normalize(c.contact.city) === pCity &&
      normalize(c.contact.state) === pState
    ) {
      return c.key;
    }
  }
  return null;
}

export function LeadMailV11Client({
  rows,
  totalSent,
  inTransitCount,
  deliveredCount,
  returnedCount,
  leadId,
  mailingAddressCount,
  candidates,
  templates,
  bankAccounts,
  mailReady,
  fromAddress,
  pricing,
}: {
  rows: MailJobListRow[];
  totalSent: number;
  inTransitCount: number;
  deliveredCount: number;
  returnedCount: number;
  leadId: string;
  mailingAddressCount: number;
  candidates: SendMailModalRecipient[];
  templates: MailTemplateRow[];
  bankAccounts: { id: string; label: string; verified: boolean }[];
  mailReady: boolean;
  fromAddress: SendMailFromAddress;
  pricing: {
    letter_first_class_bw: number;
    letter_first_class_color: number;
    letter_standard_bw: number;
    letter_standard_color: number;
    letter_certified_bw: number;
    letter_certified_color: number;
    letter_extra_page_bw: number;
    letter_extra_page_color: number;
    check_base: number;
  } | null;
}) {
  void leadId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(
    rows[0]?.id ?? null
  );
  const [detail, setDetail] = useState<MailJobDetailRow | null>(null);
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  // Send Mail modal state. resendingFor carries the failed piece when
  // opened via Fix & Resend; null when the user clicks the header
  // "Send Mail" button (regular compose).
  const [sendMailOpen, setSendMailOpen] = useState(false);
  const [resendingFor, setResendingFor] = useState<MailJobListRow | null>(null);

  // When selection changes, fetch the full detail (body_html for the
  // thumbnail). Only one request in flight at a time.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const fetched = await fetchMailJobAction(selectedId);
      if (!cancelled) setDetail(fetched);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Auto-open Send Mail in resend mode when ?resend=<piece_id> is in
  // the URL. Used by /mail's Fix & Resend button to deep-link straight
  // into the compose flow. Clears the param after consuming so a page
  // refresh doesn't keep re-opening the modal.
  useEffect(() => {
    const resendId = searchParams.get("resend");
    if (!resendId) return;
    const piece = rows.find((r) => r.id === resendId);
    if (!piece) return;
    setResendingFor(piece);
    setSendMailOpen(true);
    setSelectedId(resendId);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("resend");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = detail ?? rows.find((r) => r.id === selectedId) ?? null;

  const openCompose = useCallback(() => {
    setResendingFor(null);
    setSendMailOpen(true);
  }, []);

  const openResend = useCallback((piece: MailJobListRow) => {
    setResendingFor(piece);
    setSendMailOpen(true);
  }, []);

  // Pre-selected candidate keys for resend mode. Best-effort match on
  // the failed address; if no match, modal falls back to the first
  // candidate as usual (user can still pick the right one).
  const resendDefaultKeys = useMemo(() => {
    if (!resendingFor) return undefined;
    const key = findCandidateKeyForPiece(resendingFor, candidates);
    return key ? [key] : undefined;
  }, [resendingFor, candidates]);

  const resendNotice = useMemo(() => {
    if (!resendingFor) return null;
    const name = displayRecipientName(resendingFor.recipient_name);
    const reason = resendingFor.error_message
      ? `: ${resendingFor.error_message}`
      : ".";
    return `Resending to ${name}. The previous send was returned${reason} Verify the address is correct before sending again.`;
  }, [resendingFor]);

  return (
    <div className="space-y-5">
      {/* Header row — stats + Send Mail. */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-ink">
              Sent Mail
            </h2>
            {mailingAddressCount > 0 && (
              <div className="mt-[2px] text-[11.5px] text-gray-500">
                {mailingAddressCount} mailing{" "}
                {mailingAddressCount === 1 ? "address" : "addresses"} on file
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={openCompose}
            className="cursor-pointer rounded-md bg-petrol-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-petrol-600"
          >
            Send Mail
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-4 gap-x-6 gap-y-2">
          <StatPair label="Total Sent" value={totalSent} />
          <StatPair label="In Transit" value={inTransitCount} />
          <StatPair label="Delivered" value={deliveredCount} />
          <StatPair
            label="Returned"
            value={returnedCount}
            emphasized={returnedCount > 0}
          />
        </dl>
      </div>

      {/* Split-pane — left rail + right detail */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-[13px] text-gray-500 shadow-card">
          No mail sent to this lead yet. Click Send Mail above to start.
        </div>
      ) : (
        <div className="grid grid-cols-[260px_1fr] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          {/* Left rail */}
          <div className="border-r border-gray-200 bg-gray-50/60">
            <ul className="divide-y divide-gray-150">
              {rows.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "block w-full cursor-pointer px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "bg-white shadow-[inset_3px_0_0_#0d4b3a]"
                          : "hover:bg-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            STATUS_DOT[p.status]
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-ink">
                            {displayRecipientName(p.recipient_name)}
                          </div>
                          <div className="mt-[1px] truncate text-[10.5px] text-gray-400">
                            {fmtDateCompact(p.sent_at)}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right pane */}
          {selected && (
            <DetailPane
              piece={selected}
              detail={detail}
              onOpenLetter={() => setLetterModalOpen(true)}
              onFixAndResend={() => openResend(selected)}
            />
          )}
        </div>
      )}

      {/* Letter preview modal — opens when user clicks the thumbnail
          or the View Letter button. */}
      {letterModalOpen && selected && (
        <LetterModal
          recipient={displayRecipientName(selected.recipient_name)}
          bodyHtml={detail?.body_html ?? null}
          onClose={() => setLetterModalOpen(false)}
        />
      )}

      {/* Send Mail modal — handles both regular compose and Fix &
          Resend. Re-mounts with a fresh key when resendingFor changes
          so the initial selection logic runs again. */}
      {sendMailOpen && (
        <SendMailModal
          key={resendingFor?.id ?? "compose"}
          open={sendMailOpen}
          onClose={() => {
            setSendMailOpen(false);
            setResendingFor(null);
          }}
          templates={templates}
          candidates={candidates}
          bankAccounts={bankAccounts}
          mailReady={mailReady}
          fromAddress={fromAddress}
          pricing={pricing}
          defaultSelectedKeys={resendDefaultKeys}
          notice={resendNotice}
        />
      )}
    </div>
  );
}

function StatPair({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums",
          emphasized ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailPane({
  piece,
  detail,
  onOpenLetter,
  onFixAndResend,
}: {
  piece: MailJobListRow | MailJobDetailRow;
  detail: MailJobDetailRow | null;
  onOpenLetter: () => void;
  onFixAndResend: () => void;
}) {
  const bodyHtml = detail?.body_html ?? null;
  const trackingUrl = piece.tracking_url;
  return (
    <div className="grid grid-cols-[200px_1fr] gap-5 bg-white p-6">
      {/* Letter thumbnail — 8.5x11 portrait */}
      <button
        type="button"
        onClick={onOpenLetter}
        className="group relative shrink-0 cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white shadow-card"
        style={{ width: "200px", aspectRatio: "8.5 / 11" }}
        title="Click to view full letter"
      >
        {bodyHtml ? (
          <iframe
            title="Letter preview"
            sandbox=""
            srcDoc={bodyHtml}
            className="absolute left-0 top-0 origin-top-left h-[792px] w-[612px] scale-[0.327] bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
            No preview
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/0 to-transparent group-hover:from-black/5" />
        <div className="absolute inset-x-0 bottom-0 border-t border-gray-200 bg-white px-2 py-1 text-center text-[10px] text-gray-500 group-hover:text-petrol-700">
          Click to view
        </div>
      </button>

      {/* Meta + actions column. Status pill omitted — the left-rail
          status dot + the colored "Delivered <date>" / "Returned
          <date>" meta line below already convey state. */}
      <div className="flex min-w-0 flex-col">
        <div className="min-w-0">
          <div className="text-[18px] font-semibold tracking-tight text-ink">
            {displayRecipientName(piece.recipient_name)}
          </div>
        </div>

        <div className="mt-3 text-[12.5px] text-gray-600">
          {piece.recipient_address_line1}
          {piece.recipient_address_line2
            ? `, ${piece.recipient_address_line2}`
            : ""}
          {`, ${piece.recipient_city}, ${piece.recipient_state} ${piece.recipient_postal_code}`}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink">
          <Meta icon={IconMail}>{mailClassLabel(piece.mail_class)}</Meta>
          <Meta icon={IconCalendar}>Sent {fmtDate(piece.sent_at)}</Meta>
          {piece.status === "delivered" && piece.delivered_at && (
            <Meta icon={IconCircleCheck} tone="ok">
              Delivered {fmtDate(piece.delivered_at)}
            </Meta>
          )}
          {(piece.status === "returned" || piece.status === "failed") &&
            piece.returned_at && (
              <Meta icon={IconArrowBackUp} tone="danger">
                Returned {fmtDate(piece.returned_at)}
                {piece.error_message ? ` (${piece.error_message})` : ""}
              </Meta>
            )}
          {(piece.status === "queued" || piece.status === "in_transit") && (
            <Meta icon={IconClock}>2 to 4 business days</Meta>
          )}
        </div>

        {piece.tracking_number && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-[12px]">
            <IconBarcode size={14} stroke={1.75} className="text-petrol-500" />
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer font-mono tabular-nums text-petrol-700 underline decoration-petrol-500/40 underline-offset-2 hover:decoration-petrol-700"
                title="Open carrier tracking"
              >
                {piece.tracking_number}
              </a>
            ) : (
              <span className="font-mono tabular-nums text-gray-600">
                {piece.tracking_number}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-4 text-[11.5px] font-medium">
          {/* Same min-w-[110px] / h-[30px] family as V6 so the button
              set reads consistent across surfaces. Fix & Resend renders
              only for returned/failed pieces, sitting next to Track. */}
          <button
            type="button"
            onClick={onOpenLetter}
            className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-petrol-500 px-3 text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-petrol-600"
          >
            View Letter
          </button>
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md border border-petrol-500/25 bg-white px-3 text-petrol-700 hover:bg-petrol-50"
            >
              Track
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-[30px] min-w-[110px] cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-gray-400"
            >
              Track
            </button>
          )}
          {(piece.status === "returned" || piece.status === "failed") && (
            <button
              type="button"
              onClick={onFixAndResend}
              className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-danger px-3 font-semibold text-white hover:opacity-90"
            >
              Fix &amp; Resend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
  tone,
}: {
  icon: typeof IconMail;
  children: React.ReactNode;
  tone?: "ok" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        tone === "ok"
          ? "text-petrol-700"
          : tone === "danger"
            ? "text-danger"
            : "text-ink"
      )}
    >
      <Icon
        size={13}
        stroke={1.75}
        className={
          tone === "ok"
            ? "text-petrol-500"
            : tone === "danger"
              ? "text-danger"
              : "text-petrol-500"
        }
      />
      {children}
    </span>
  );
}

function LetterModal({
  recipient,
  bodyHtml,
  onClose,
}: {
  recipient: string;
  bodyHtml: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] flex-col items-center gap-3">
        <header className="flex w-[560px] max-w-[90vw] items-center justify-between rounded-lg border border-gray-200 bg-surface px-4 py-2.5 shadow-card">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Letter Sent To
            </div>
            <div className="truncate text-[13px] font-medium text-ink">
              {recipient}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IconX size={15} stroke={1.75} />
          </button>
        </header>
        <div
          className="overflow-hidden rounded-sm border border-gray-300 bg-white shadow-xl"
          style={{ width: "560px", maxWidth: "90vw", aspectRatio: "8.5 / 11" }}
        >
          {bodyHtml ? (
            <iframe
              title="Letter preview"
              sandbox=""
              srcDoc={bodyHtml}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[12.5px] text-gray-500">
              Letter content not stored for this piece.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
