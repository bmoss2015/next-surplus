"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import {
  sendMail,
  previewMailMergeDocx,
  getMailTemplateAttachmentPageCount,
  type RecipientInput,
} from "@/lib/mail/actions";
import { verifyAddressAction } from "@/app/(app)/mail/_verify-action";
import type { AddressVerifyResult } from "@/lib/mail/verify-address";
import { renderMerge, MERGE_FIELDS, MERGE_GROUP_LABELS } from "@/lib/mail/merge";
import type { MailTemplateRow } from "@/lib/settings/fetch";
import type { SendMailFromAddress } from "./SendMailButton";

// SuperDoc remains the in-app docx editor (Settings > Mail Templates) but
// is intentionally NOT used as a preview renderer here. Its font handling
// diverged from the printer's render. The Send Mail preview now goes
// through Gotenberg (PDF) or mammoth HTML fallback — see
// previewMailMergeDocx in src/lib/mail/actions.ts.

export type SendMailModalRecipient = {
  // Stable id we use for the multi-select toggle in the picker UI
  key: string;
  // Optional: the underlying record references (so the mail_jobs row links)
  relative_id?: string | null;
  lead_party_id?: string | null;
  lead_id?: string | null;
  // Relationship shown as a chip in the picker (e.g. Owner, Relative,
  // Contact, or a lead-party role like "County Clerk"). Defaults to
  // "Recipient" when the source row has no clearer label.
  relation: string;
  // Whether a letter has already been sent to this recipient (and when).
  // Only meaningful for contacts-table rows; relatives and lead_parties
  // don't track this yet so they always report false.
  mailed: boolean;
  mailed_at: string | null;
  // The merge context for this recipient — first_name, last_name, address...
  contact: {
    first_name: string;
    last_name: string;
    full_name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
  };
  // Optional context for {{lead.*}} merge fields
  lead?: Record<string, string | number | null | undefined>;
};

export type SendMailModalProps = {
  open: boolean;
  onClose: () => void;
  // Optional callback fired AFTER a successful send (before onClose
  // runs). Used by the lead Mail tab to flash a "Letter sent" banner.
  // Receives the list of recipient names that were sent to.
  onSuccess?: (recipientNames: string[]) => void;
  templates: MailTemplateRow[];
  candidates: SendMailModalRecipient[];
  bankAccounts: { id: string; label: string; verified: boolean }[];
  defaultMailClass?: "standard" | "first_class" | "certified";
  // True when the org has a complete return address. When false, sending is
  // blocked at the UI level and a callout explains where to fix it.
  mailReady: boolean;
  fromAddress: SendMailFromAddress;
  // Optional pre-selection. When provided, the modal opens with these
  // candidate keys checked. Used for "Fix & Resend" flow where we want
  // the user to send to the same recipient(s) again (after they fix
  // the address). If none of the keys match a candidate, falls back to
  // the default first-candidate selection.
  defaultSelectedKeys?: string[];
  // Optional banner shown at the top of the modal — typically the
  // "resending to <name> after <reason>" callout for Fix & Resend.
  notice?: string | null;
  // True when LOB_API_KEY starts with `test_`. Lob test mode is
  // permissive — it returns "deliverable" for plausibly-formatted
  // junk addresses without running real CASS. The modal shows a
  // sticky banner so the operator knows verification isn't strict.
  lobTestMode?: boolean;
  // Customer-facing rate schedule from app_pricing_config. Drives the
  // CostEstimate "Estimated total" line. Optional so any existing caller
  // that doesn't pass it gets a "pricing not configured" placeholder.
  pricing?: {
    letter_first_class_bw: number;
    letter_first_class_color: number;
    letter_standard_bw: number;
    letter_standard_color: number;
    letter_certified_bw: number;
    letter_certified_color: number;
    letter_extra_page_bw: number;
    letter_extra_page_color: number;
    check_base: number;
    letter_over_6_sheet_fee?: number;
  } | null;
};

export function SendMailModal({
  open,
  onClose,
  onSuccess,
  templates,
  candidates,
  bankAccounts,
  defaultMailClass = "first_class",
  mailReady,
  fromAddress,
  defaultSelectedKeys,
  notice,
  lobTestMode,
  pricing,
}: SendMailModalProps) {
  const hasVerifiedBank = bankAccounts.some((b) => b.verified);
  const router = useRouter();
  // If the caller passes defaultSelectedKeys (Fix & Resend flow), use the
  // ones that actually match a candidate. Falls back to first candidate.
  const initialSelected = useMemo(() => {
    if (defaultSelectedKeys && defaultSelectedKeys.length > 0) {
      const valid = defaultSelectedKeys.filter((k) =>
        candidates.some((c) => c.key === k)
      );
      if (valid.length > 0) return new Set(valid);
    }
    return new Set(candidates.slice(0, 1).map((c) => c.key));
    // We only want to initialize once when the modal mounts/opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedKeys, setSelectedKeys] =
    useState<Set<string>>(initialSelected);
  const [templateId, setTemplateId] = useState<string | "blank">(
    templates[0]?.id ?? "blank"
  );
  const [body, setBody] = useState<string>(() => {
    const t = templates.find((t) => t.id === templateId);
    return t?.body_html ?? "";
  });
  const [mailClass, setMailClass] = useState<
    "standard" | "first_class" | "certified"
  >(defaultMailClass);
  const [includeCheck, setIncludeCheck] = useState(false);
  const [checkAmount, setCheckAmount] = useState<string>("");
  const [checkMemo, setCheckMemo] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>(
    bankAccounts.find((b) => b.verified)?.id ?? ""
  );
  const [colorPrint, setColorPrint] = useState(false);
  // Stable idempotency key per modal open. Reused across retries so a
  // double-click / refresh during send doesn't double-bill. Rotated only
  // when the server returns an error (the operator is correcting then
  // resubmitting — that should be a fresh attempt).
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Refs for the form + preview error banners so we can scroll them
  // into view when an error fires. Without scrollIntoView, the user
  // can be scrolled to the bottom of the modal (e.g. at the Send
  // Letter button) and never see a top-of-modal error. sticky top-0
  // on both banners pins them once visible.
  const formErrBannerRef = useRef<HTMLDivElement | null>(null);
  const previewErrBannerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!err) return;
    const target = showPreview
      ? previewErrBannerRef.current
      : formErrBannerRef.current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [err, showPreview]);
  const [pending, startTransition] = useTransition();
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  // Per-recipient address overrides. Set when the user accepts
  // Lob's suggested correction for an undeliverable / unit-warning
  // address. The override wins over the candidate's original address
  // in both the displayed value and the send payload.
  const [addressOverrides, setAddressOverrides] = useState<
    Record<
      string,
      {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        postal_code: string;
      }
    >
  >({});
  // Which recipient's "fix it" panel is open (null = none open).
  // Clicking the address-status pill toggles this. Only one open at
  // a time to keep the picker scannable.
  const [expandedFixRecipient, setExpandedFixRecipient] = useState<
    string | null
  >(null);
  // Which recipient is currently re-verifying after a correction is
  // applied. UI shows a small spinner on that row's pill.
  const [reVerifyingKey, setReVerifyingKey] = useState<string | null>(null);

  // Resolve the address a recipient should be sent to. Priority:
  //   1. User-accepted override (from the "Use Lob's version" button)
  //   2. Original candidate address
  // Used for the row display + as the input to the verifyAddress call.
  function effectiveAddress(c: SendMailModalRecipient) {
    const override = addressOverrides[c.key];
    if (override) return override;
    return {
      line1: c.contact.line1,
      line2: c.contact.line2 ?? null,
      city: c.contact.city,
      state: c.contact.state,
      postal_code: c.contact.postal_code,
    };
  }

  // Apply a Lob-suggested correction for this recipient. Stores it as
  // an override + re-runs verify on the new address. The pill flips
  // to Verified once Lob confirms the corrected version.
  async function applyAddressSuggestion(
    c: SendMailModalRecipient,
    suggested: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postal_code: string;
    }
  ) {
    setReVerifyingKey(c.key);
    setAddressOverrides((prev) => ({ ...prev, [c.key]: suggested }));
    const res = await verifyAddressAction(suggested);
    setVerifyResults((prev) => ({ ...prev, [c.key]: res }));
    setReVerifyingKey(null);
    setExpandedFixRecipient(null);
    setErr(null);
  }

  // Pre-send address verification (Lob /us_verifications) results,
  // keyed by recipient.key. Populated when the user clicks Send;
  // an "undeliverable" result blocks the actual send and shows an
  // inline error on the offending recipient. Normalized addresses
  // replace the raw user input in the send payload so the printer
  // gets the deliverable form.
  const [verifyResults, setVerifyResults] = useState<
    Record<string, AddressVerifyResult>
  >({});
  const [verifying, setVerifying] = useState(false);

  // Templates show in alphabetical order. Folder-aware grouping in the
  // picker UI happens at render time below.
  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  );

  const selectedRecipients = useMemo(
    () => candidates.filter((c) => selectedKeys.has(c.key)),
    [candidates, selectedKeys]
  );

  const checkAmountCents = useMemo(() => {
    const n = parseFloat(checkAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [checkAmount]);

  function pickTemplate(id: string) {
    setTemplateId(id);
    if (id === "blank") {
      setBody("");
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    // File-based templates (.docx with optional PDF attachments) don't
    // need a body — merge happens against the Word doc itself at send
    // time. Reset body so the empty-body guard doesn't block sending.
    if (t.docx_path) {
      setBody("");
    } else if (t.body_html) {
      setBody(t.body_html);
    }
    if (t.default_mail_class) setMailClass(t.default_mail_class);
  }

  // Memoized lookup for the currently picked template so the rest of
  // the form can branch on file vs HTML without re-finding.
  const selectedTemplate = useMemo(
    () => templates.find((x) => x.id === templateId) ?? null,
    [templates, templateId]
  );
  const isFileTemplate = Boolean(selectedTemplate?.docx_path);

  // Real PDF page count across the selected template's attachments,
  // counted server-side via pdfjs-dist when a file template is picked.
  // Null while loading or when not applicable. Word cover page count
  // remains unknown (not renderable without LibreOffice).
  const [attachmentPdfPages, setAttachmentPdfPages] = useState<number | null>(
    null
  );
  useEffect(() => {
    if (!isFileTemplate || !selectedTemplate) {
      setAttachmentPdfPages(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getMailTemplateAttachmentPageCount(selectedTemplate.id);
      if (cancelled) return;
      setAttachmentPdfPages(res.ok ? res.pdf_pages : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [isFileTemplate, selectedTemplate?.id]);

  function insertField(key: string) {
    const token = `{{${key}}}`;
    if (!bodyRef) {
      setBody((prev) => prev + token);
      return;
    }
    const start = bodyRef.selectionStart ?? body.length;
    const end = bodyRef.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      bodyRef.focus();
      const cursor = start + token.length;
      bodyRef.setSelectionRange(cursor, cursor);
    });
  }

  function toggleRecipient(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // Clear stale errors — most pre-flight errors are about a specific
    // recipient, so unchecking them is the natural "I fixed it" signal.
    setErr(null);
  }

  function buildMergeContext(r: SendMailModalRecipient) {
    return {
      "contact.first_name": r.contact.first_name,
      "contact.last_name": r.contact.last_name,
      "contact.full_name": r.contact.full_name,
      "contact.address": [
        r.contact.line1,
        r.contact.line2,
        `${r.contact.city}, ${r.contact.state} ${r.contact.postal_code}`,
      ]
        .filter(Boolean)
        .join("\n"),
      "contact.city": r.contact.city,
      "contact.state": r.contact.state,
      "contact.zip": r.contact.postal_code,
      ...(r.lead ?? {}),
    } as Record<string, string | number | null | undefined>;
  }

  async function send() {
    setErr(null);
    if (selectedRecipients.length === 0) {
      setErr("Pick at least one recipient");
      return;
    }
    if (!isFileTemplate && !body.trim()) {
      setErr("Letter body is required");
      return;
    }
    if (includeCheck) {
      if (checkAmountCents <= 0) {
        setErr("Enter a check amount greater than zero");
        return;
      }
      if (!bankAccountId) {
        setErr("Pick a verified bank account for the check");
        return;
      }
    }

    // Structural pre-flight checks. Lob's test API is permissive and
    // returns "deliverable" for plausible-looking junk; these client-
    // side guards reject the obvious fakes before paying for Lob and
    // before the customer sees a post-click failure on prod.
    //
    // What we check:
    //   1. Valid US state code (2-letter, in the canonical list).
    //   2. 5-digit ZIP (with optional ZIP+4 extension).
    //   3. Line1 quality: >= 5 chars AND contains both digits AND
    //      letters. Catches "Fake Street" (no digits) and "12345" (no
    //      letters).
    //   4. City non-empty, contains letters (not pure numbers).
    //   5. Recipient name / line1 / city don't start with junk
    //      placeholders (test, fake, asdf, null, none, n/a).
    const issue = firstAddressIssue(selectedRecipients);
    if (issue) {
      setErr(issue);
      return;
    }

    // Pre-send address verification (Lob /us_verifications). Always
    // runs — pre-flight is the contract that keeps bad addresses from
    // surfacing as post-click errors. The $0.05/send cost is baked
    // into retail rates (migration 0127).
    setVerifying(true);
    const results = await Promise.all(
      selectedRecipients.map(async (r) => {
        const addr = effectiveAddress(r);
        const res = await verifyAddressAction(addr);
        return [r.key, res] as const;
      })
    );
    const verifyEntries = results;
    const nextResults: Record<string, AddressVerifyResult> = {};
    for (const [key, res] of results) nextResults[key] = res;
    setVerifyResults(nextResults);
    setVerifying(false);

    const undeliverable = verifyEntries.filter(
      ([, res]) => res.ok && res.deliverability === "undeliverable"
    );
    if (undeliverable.length > 0) {
      setErr(
        undeliverable.length === 1
          ? "1 recipient has an undeliverable address. Fix it or remove them, then send again."
          : `${undeliverable.length} recipients have undeliverable addresses. Fix or remove them, then send again.`
      );
      return;
    }
    const verifyErrors = verifyEntries.filter(([, res]) => !res.ok);
    if (verifyErrors.length > 0) {
      // Lob itself errored. Don't block the send — surface the issue
      // but let the user proceed (verification is a courtesy, not a
      // hard gate when the verifier itself is down).
      setErr(
        "Address verification failed for one or more recipients. You can still send, but addresses won't be normalized."
      );
    }

    // Resolve the address that actually gets sent to the provider.
    // Priority: user-accepted override (from the "Use Lob's version"
    // button) > Lob's normalized version > raw user input. The
    // override is the strongest signal — the customer explicitly
    // accepted that exact address.
    const normalizedFor = (r: SendMailModalRecipient) => {
      const override = addressOverrides[r.key];
      if (override) return override;
      const v = nextResults[r.key];
      if (v && v.ok && v.deliverability !== "undeliverable") {
        return {
          line1: v.normalized.line1,
          line2: v.normalized.line2,
          city: v.normalized.city,
          state: v.normalized.state,
          postal_code: v.normalized.postal_code,
        };
      }
      return {
        line1: r.contact.line1,
        line2: r.contact.line2 ?? null,
        city: r.contact.city,
        state: r.contact.state,
        postal_code: r.contact.postal_code,
      };
    };

    const payload = {
      recipients: selectedRecipients.map<RecipientInput>((r) => {
        const addr = normalizedFor(r);
        // Candidate keys are formed as `contact:${contacts.id}`.
        // Parse to extract the contact_id so sendMail can flip the
        // mailed flag + bump mail_count via primary-key match
        // instead of fuzzy line1 ilike.
        const contactId =
          typeof r.key === "string" && r.key.startsWith("contact:")
            ? r.key.slice("contact:".length)
            : null;
        return {
          relative_id: r.relative_id ?? null,
          lead_party_id: r.lead_party_id ?? null,
          lead_id: r.lead_id ?? null,
          contact_id: contactId,
          name: r.contact.full_name,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          postal_code: addr.postal_code,
          country: "US",
          merge_context: buildMergeContext(r),
        };
      }),
      template_id: templateId === "blank" ? null : templateId,
      body_html: body,
      mail_class: mailClass,
      color: colorPrint,
      include_check: includeCheck,
      check_amount_cents: includeCheck ? checkAmountCents : null,
      check_memo: includeCheck ? checkMemo || null : null,
      bank_account_id: includeCheck ? bankAccountId || null : null,
      // Idempotency key tied to this submit attempt. If the same key
      // reaches the server twice (double-click, retried fetch, refresh
      // during in-flight), sendMail returns the original result without
      // re-charging or re-sending.
      idempotency_key: idempotencyKey,
    };
    startTransition(async () => {
      const res = await sendMail(payload);
      if (res.ok) {
        // Notify parent BEFORE closing so it can flash a confirmation
        // banner that survives the modal unmount.
        onSuccess?.(selectedRecipients.map((r) => r.contact.full_name));
        // Close FIRST so the modal disappears the instant the send
        // succeeds (matches Mailchimp / Lob dashboard / Postalytics
        // pattern). The refresh runs in the background.
        onClose();
        router.refresh();
      } else {
        setErr(res.error);
        // Rotate the idempotency key so a retry after fixing the error
        // doesn't get short-circuited by the cache. Only mint a new one
        // on a real failure — a passive double-click should still hit
        // the same key.
        setIdempotencyKey(crypto.randomUUID());
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
  const sectionClass = "space-y-2";

  return (
    <Modal
      open={open}
      onClose={
        pending
          ? () => {}
          : showPreview
            ? () => setShowPreview(false)
            : onClose
      }
      title={showPreview ? "Letter Preview" : "Send Mail"}
      description={
        showPreview
          ? "Close to return to the send form"
          : selectedRecipients.length > 1
            ? `Batch of ${selectedRecipients.length}`
            : undefined
      }
      width={showPreview ? 920 : 680}
    >
      {showPreview ? (
        <PreviewPane
          recipients={selectedRecipients}
          body={body}
          buildContext={buildMergeContext}
          idx={previewIdx}
          setIdx={setPreviewIdx}
          color={colorPrint}
          checkInfo={
            includeCheck
              ? {
                  amountDollars: checkAmount.trim(),
                  memo: checkMemo.trim(),
                  bankLabel:
                    bankAccounts.find((b) => b.id === bankAccountId)?.label ??
                    "Selected bank account",
                  fromName: fromAddress.name,
                  fromLine1: fromAddress.line1,
                  fromCityStateZip: `${fromAddress.city}, ${fromAddress.region} ${fromAddress.postal_code}`,
                }
              : null
          }
          fileTemplate={
            isFileTemplate && selectedTemplate
              ? {
                  name: selectedTemplate.name,
                  attachmentNames: selectedTemplate.attachment_paths.map(
                    (p) => p.split("/").pop() ?? p
                  ),
                }
              : null
          }
          templateId={
            isFileTemplate && selectedTemplate ? selectedTemplate.id : null
          }
          fromAddress={fromAddress}
          onBack={() => setShowPreview(false)}
          onSend={send}
          sendDisabled={pending || verifying}
          sendLabel={
            pending
              ? "Sending..."
              : verifying
                ? "Verifying addresses..."
                : selectedRecipients.length <= 1
                  ? "Send Letter"
                  : `Send ${selectedRecipients.length} Letters`
          }
          sendErr={err}
        />
      ) : (
        <div className="space-y-5">
          {!mailReady && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-danger">
              Your return address isn&apos;t filled out yet. Add a Company
              Address in Settings before sending mail.
            </div>
          )}
          {/* Top-of-modal error banner. STICKY-positioned so it stays
              visible even when the user has scrolled the form to the
              bottom (e.g. clicked Send Letter at the footer with the
              recipients list scrolled past). Also auto-scrolls the
              banner into view via the useEffect below. Anchored on
              Linear / Mailchimp / Stripe pattern: error must be in
              the user's viewport at the moment they need to see it. */}
          {err && (
            <div
              ref={formErrBannerRef}
              role="alert"
              className="sticky top-0 z-20 flex items-start gap-2.5 rounded-md border-2 border-danger/40 bg-red-50 px-3.5 py-2.5"
              style={{ boxShadow: "0 4px 12px rgba(180, 35, 24, 0.18)" }}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-danger"
                style={{ marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
              </svg>
              <div className="flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-danger">
                  Can&apos;t send yet
                </div>
                <div className="mt-0.5 text-[12.5px] font-medium text-danger">
                  {err}
                </div>
              </div>
            </div>
          )}
          {notice && (
            <div className="rounded-md border border-petrol-200 bg-petrol-50 px-3 py-2 text-[12px] text-petrol-700">
              {notice}
            </div>
          )}
          {lobTestMode && (
            <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-[11.5px] text-gray-700">
              <span className="font-semibold uppercase tracking-wide text-[10.5px]">
                Test mode
              </span>
              <span className="ml-2">
                Lob test API is permissive — it accepts plausibly
                formatted junk without running real CASS. Use a live
                key on production to verify real deliverability. Local
                structural checks still block fake addresses pre-click.
              </span>
            </div>
          )}

          {/* Recipients */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div className={labelClass}>Recipients</div>
              <div className="text-[11px] text-gray-500">
                {selectedRecipients.length} of {candidates.length} selected
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
              {candidates.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-gray-500">
                  No candidates with mailing addresses found.
                </div>
              ) : (
                candidates.map((c) => {
                  const checked = selectedKeys.has(c.key);
                  const override = addressOverrides[c.key] ?? null;
                  const addr = effectiveAddress(c);
                  const verifyResult = verifyResults[c.key] ?? null;
                  const isExpanded = expandedFixRecipient === c.key;
                  const canFix =
                    verifyResult &&
                    verifyResult.ok &&
                    verifyResult.deliverability !== "deliverable";
                  return (
                    <div
                      key={c.key}
                      className="border-b border-gray-150 last:border-b-0 hover:bg-white"
                    >
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-[10px]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRecipient(c.key)}
                          className="mt-[4px] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium text-ink">
                              {c.contact.full_name}
                            </span>
                            <span className="rounded-full border border-petrol-200 bg-petrol-50 px-2 py-[1px] text-[10px] font-medium text-petrol-700">
                              {c.relation}
                            </span>
                            {c.mailed ? (
                              <span className="rounded-full bg-gradient-to-br from-[#0d4b3a] to-[#13644e] px-2 py-[1px] text-[10px] font-medium text-white">
                                Mailed
                                {c.mailed_at
                                  ? ` ${new Date(c.mailed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                  : ""}
                              </span>
                            ) : (
                              <span className="rounded-full border border-gray-200 bg-white px-2 py-[1px] text-[10px] font-medium text-gray-500">
                                Not Mailed
                              </span>
                            )}
                            {/* Status badge — clickable when there's
                                something to fix. */}
                            <AddressBadge
                              result={verifyResult}
                              loading={reVerifyingKey === c.key}
                              onClick={
                                canFix
                                  ? (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedFixRecipient((prev) =>
                                        prev === c.key ? null : c.key
                                      );
                                    }
                                  : undefined
                              }
                            />
                            {override && (
                              <span
                                className="rounded-full border border-petrol-200 bg-petrol-50 px-2 py-[1px] text-[10px] font-medium text-petrol-700"
                                title="Address was corrected using Lob's suggestion"
                              >
                                Corrected
                              </span>
                            )}
                          </div>
                          <div className="mt-[2px] text-[11.5px] text-gray-500">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""},{" "}
                            {addr.city}, {addr.state} {addr.postal_code}
                          </div>
                        </div>
                      </label>
                      {isExpanded && verifyResult && verifyResult.ok && (
                        <AddressFixPanel
                          original={addr}
                          result={verifyResult}
                          onApply={(suggested) =>
                            applyAddressSuggestion(c, suggested)
                          }
                          onClose={() => setExpandedFixRecipient(null)}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Template */}
          <div className="space-y-1">
            <div className={labelClass}>Template</div>
            <select
              value={templateId}
              onChange={(e) => pickTemplate(e.target.value)}
              className={`${inputClass} w-full cursor-pointer`}
            >
              <option value="blank">Blank (write from scratch)</option>
              {sortedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Body — hidden when a Word/PDF template is picked, since merge
              happens against the template's own document at send time. */}
          {isFileTemplate ? (
            <div className="rounded-md border border-petrol-200 bg-petrol-50 p-3">
              <div className="text-[12px] font-medium text-petrol-700">
                Document Template
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-ink">
                This template is a Word document
                {selectedTemplate &&
                selectedTemplate.attachment_paths.length > 0
                  ? ` plus ${selectedTemplate.attachment_paths.length} attachment${
                      selectedTemplate.attachment_paths.length === 1 ? "" : "s"
                    }`
                  : ""}
                . Merge fields fill in automatically per recipient at print
                time — no body text needed here.
              </div>
              {selectedTemplate &&
                selectedTemplate.attachment_paths.length > 0 && (
                  <ul className="mt-2 space-y-[2px] text-[11px] text-gray-600">
                    {selectedTemplate.attachment_paths.map((p, i) => (
                      <li key={p}>
                        {i + 1}. {p.split("/").pop()}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className={labelClass}>Body</div>
                <FieldPicker onInsert={insertField} />
              </div>
              <textarea
                ref={setBodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Dear {{contact.first_name}},..."
                className={`${inputClass} w-full resize-y font-mono`}
              />
            </div>
          )}

          {/* Mail class — Certified is hidden until the Lob plan
              supports it (Startup tier+). Only Standard + First Class
              for now. */}
          <div className={sectionClass}>
            <div className={labelClass}>Mail Class</div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["standard", "Standard", "3-10 days"],
                  ["first_class", "First Class", "1-5 days"],
                ] as const
              ).map(([value, label, sub]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col gap-[2px] rounded-md border px-3 py-2 text-[13px] ${
                    mailClass === value
                      ? "border-petrol-500 bg-petrol-500/5"
                      : "border-gray-200 bg-surface hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mail_class"
                      value={value}
                      checked={mailClass === value}
                      onChange={() => setMailClass(value)}
                      className="cursor-pointer"
                    />
                    <span className="font-medium text-ink">{label}</span>
                  </div>
                  <span className="pl-[20px] text-[11px] text-gray-500">
                    {sub}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Color toggle */}
          <div className={sectionClass}>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-200 bg-surface px-3 py-[10px] hover:border-gray-300">
              <div className="text-[13px] font-medium text-ink">
                Print in Color
              </div>
              <input
                type="checkbox"
                checked={colorPrint}
                onChange={(e) => setColorPrint(e.target.checked)}
                className="cursor-pointer"
              />
            </label>
          </div>

          {/* Check */}
          <div className="space-y-2 rounded-md border border-gray-200 p-3">
            <label
              className={`flex items-center gap-2 ${hasVerifiedBank ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              title={
                hasVerifiedBank
                  ? undefined
                  : "Add and verify a bank account in Settings before sending checks"
              }
            >
              <input
                type="checkbox"
                checked={includeCheck}
                disabled={!hasVerifiedBank}
                onChange={(e) => setIncludeCheck(e.target.checked)}
                className="cursor-pointer"
              />
              <span className="text-[13px] font-medium text-ink">
                Include a check with this letter
              </span>
              {!hasVerifiedBank && (
                <span className="ml-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-[1px] text-[10px] font-medium text-gray-500">
                  Needs verified bank account
                </span>
              )}
            </label>
            {includeCheck && (
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={checkAmount}
                    onChange={(e) => setCheckAmount(e.target.value)}
                    onBlur={(e) => {
                      // Auto-format on blur: parse to a number then pin
                      // to 2 decimal places ("1000" -> "1000.00",
                      // "12.5" -> "12.50"). Leave blank values alone.
                      const v = e.target.value.trim();
                      if (!v) return;
                      const n = Number(v);
                      if (!Number.isFinite(n) || n <= 0) return;
                      setCheckAmount(n.toFixed(2));
                    }}
                    placeholder="0.00"
                    className={`${inputClass} w-full pl-6 text-right tabular-nums`}
                  />
                </div>
                <input
                  type="text"
                  value={checkMemo}
                  onChange={(e) => setCheckMemo(e.target.value)}
                  placeholder="Memo"
                  className={`${inputClass} w-full`}
                />
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className={`${inputClass} col-span-2 cursor-pointer`}
                >
                  <option value="">Pick a bank account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id} disabled={!b.verified}>
                      {b.label}
                      {b.verified ? "" : " (unverified)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CostEstimate removed per Bree feedback — CRM convention
              is to hide per-action pricing inside the modal. Pricing
              lives in /owner > Customer Pricing where the operator
              can set rates; not surfaced at send time. */}

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewIdx(0);
                setShowPreview(true);
              }}
              disabled={
                pending ||
                !mailReady ||
                selectedRecipients.length === 0 ||
                (!isFileTemplate && !body.trim()) ||
                (includeCheck && !hasVerifiedBank)
              }
              title={
                !mailReady
                  ? "Add a Company Address in Settings before sending mail"
                  : undefined
              }
              className="cursor-pointer rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
            >
              Preview &amp; Send
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Cost estimate displaying YOUR pricing for the selected class + color.
// Reads the customer-facing rate schedule passed in by the parent (from
// app_pricing_config.customer_mail_pricing_cents). All-inclusive rates
// (printing + postage + envelope).
type LetterPricing = {
  letter_first_class_bw: number;
  letter_first_class_color: number;
  letter_standard_bw: number;
  letter_standard_color: number;
  letter_certified_bw: number;
  letter_certified_color: number;
  letter_extra_page_bw: number;
  letter_extra_page_color: number;
  check_base: number;
  // USPS over-6-sheets weight-tier surcharge. Optional so older callers
  // that don't pass it still render. Same rate regardless of color.
  letter_over_6_sheet_fee?: number;
};

function CostEstimate({
  recipients,
  mailClass,
  isColor,
  attachmentPdfPages,
  attachmentFileCount,
  isFileTemplate,
  includeCheck,
  pricing,
}: {
  recipients: number;
  mailClass: "standard" | "first_class" | "certified";
  isColor: boolean;
  attachmentPdfPages: number | null;
  attachmentFileCount: number;
  isFileTemplate: boolean;
  includeCheck: boolean;
  pricing: LetterPricing | null;
}) {
  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Page summary string — only as specific as we can verify.
  const pagesPerPiece = (() => {
    if (!isFileTemplate) return "1+";
    if (attachmentPdfPages == null) {
      return attachmentFileCount > 0 ? "Word cover + attachments" : "1+";
    }
    return `Word cover + ${attachmentPdfPages} PDF page${attachmentPdfPages === 1 ? "" : "s"}`;
  })();

  if (!pricing) return null;

  // Per-letter rate from the customer pricing schedule.
  const letterCents = (() => {
    if (mailClass === "standard")
      return isColor ? pricing.letter_standard_color : pricing.letter_standard_bw;
    if (mailClass === "certified")
      return isColor ? pricing.letter_certified_color : pricing.letter_certified_bw;
    return isColor ? pricing.letter_first_class_color : pricing.letter_first_class_bw;
  })();
  // USPS weight-tier surcharge kicks in past 6 single-sided sheets. We
  // only know the sheet count for the file-template path (Word cover +
  // PDF attachments). HTML-body letters are assumed to fit within 6.
  const totalSheets = isFileTemplate
    ? 1 + (attachmentPdfPages ?? 0)
    : 1;
  const triggersOver6Fee = totalSheets > 6;
  const over6FeeCents =
    triggersOver6Fee ? (pricing.letter_over_6_sheet_fee ?? 0) : 0;
  const letterDollars = letterCents / 100;
  const over6FeeDollars = over6FeeCents / 100;
  const checkDollars = includeCheck ? pricing.check_base / 100 : 0;
  const grand = (letterDollars + over6FeeDollars + checkDollars) * recipients;

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-ink">
      {triggersOver6Fee && (
        <div
          className="mb-2 rounded px-2 py-1.5 text-[10.5px]"
          style={{
            background: "#fef2f2",
            color: "#b42318",
            border: "1px solid rgba(180, 35, 24, 0.20)",
          }}
        >
          This letter is {totalSheets} sheets. USPS adds a {fmt(over6FeeDollars)}{" "}
          weight surcharge per piece beyond 6 sheets.
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="font-medium">Estimated total</span>
        <span className="tabular-nums text-ink">{fmt(grand)}</span>
      </div>
      <div className="mt-[2px] text-[10px] text-gray-600">
        {recipients} {recipients === 1 ? "piece" : "pieces"} · {pagesPerPiece}{" "}
        per piece
      </div>
    </div>
  );
}

// Canonical US state / DC / territory codes accepted by USPS. Used by
// the address pre-flight to reject typos like "TX1" or "California"
// before they reach Lob.
const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC","PR","VI","GU","AS","MP",
]);

const JUNK_PREFIX = /^(test|fake|asdf|null|none|n\/a)\b/i;

// Returns the first user-readable problem found across the selected
// recipients, or null if every address passes the structural sanity
// checks. Order: state -> ZIP -> line1 -> city -> junk patterns.
function firstAddressIssue(
  recipients: SendMailModalRecipient[]
): string | null {
  for (const r of recipients) {
    const name = r.contact.full_name || "recipient";
    const line1 = r.contact.line1.trim();
    const city = r.contact.city.trim();
    const state = r.contact.state.trim().toUpperCase();
    const zip = r.contact.postal_code.trim();

    if (!US_STATE_CODES.has(state)) {
      return `${name}'s address has an unknown state code "${r.contact.state}". Use a 2-letter code like TX or CA.`;
    }
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      return `${name}'s ZIP "${r.contact.postal_code}" doesn't look right. Use 5 digits like 78701.`;
    }
    if (line1.length < 5) {
      return `${name}'s street address is too short. Add the full street.`;
    }
    if (!/\d/.test(line1)) {
      return `Address for ${name} has no street number. Fix it before sending.`;
    }
    if (!/[a-z]/i.test(line1)) {
      return `${name}'s street address has no street name, only numbers.`;
    }
    if (city.length === 0) {
      return `${name}'s city is blank.`;
    }
    if (!/[a-z]/i.test(city)) {
      return `${name}'s city doesn't contain any letters.`;
    }
    if (
      JUNK_PREFIX.test(line1) ||
      JUNK_PREFIX.test(city) ||
      JUNK_PREFIX.test(r.contact.full_name)
    ) {
      return `${name}'s address looks like a placeholder ("${line1}, ${city}"). Replace with a real address.`;
    }
  }
  return null;
}

// Visual mock-up of the check Lob will print. Standard business check
// layout: payee + date on top, amount box on the right, amount in words
// below, memo + signature line at bottom. NOT a real check image — just
// a faithful preview so the user verifies what they're about to mail.
function CheckSample({
  recipientName,
  amountDollars,
  memo,
  bankLabel,
  fromName,
  fromLine1,
  fromCityStateZip,
  dateLabel,
}: {
  recipientName: string;
  amountDollars: string;
  memo: string;
  bankLabel: string;
  fromName: string;
  fromLine1: string;
  fromCityStateZip: string;
  dateLabel: string;
}) {
  const amountNum = Number(amountDollars.replace(/[,$\s]/g, ""));
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const amountFmt = amountValid
    ? amountNum.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
  const amountWords = amountValid ? dollarsToWords(amountNum) : "";

  return (
    <div className="mx-auto mb-3 max-w-[640px]">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">
        Check Preview
      </div>
      <div
        className="relative w-full overflow-hidden rounded-sm border border-gray-300 bg-white"
        style={{ aspectRatio: "6 / 2.75" }}
      >
        {/* Watermark texture so the check reads as paper. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #fafbfc 0%, #fff 50%, #fafbfc 100%)",
          }}
        />

        {/* Three-row layout: header (drawer + date + amount), middle
            (payee + amount-in-words spans full width), footer
            (memo bottom-left + signature bottom-right spans full
            width). The earlier version nested memo + signature
            inside the left column so they only spanned half the
            check — fix is to lift them to a full-width footer row. */}
        <div className="relative flex h-full flex-col p-4 text-[11px] text-ink">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="text-[10.5px] leading-tight">
              <div className="font-semibold">{fromName}</div>
              <div className="text-gray-600">{fromLine1}</div>
              <div className="text-gray-600">{fromCityStateZip}</div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-500">
                  Date
                </span>
                <span className="border-b border-gray-400 pb-[1px] px-2 text-[10px] text-ink">
                  {dateLabel}
                </span>
              </div>
              <div
                className="rounded-sm border border-gray-400 px-2 py-1 text-right tabular-nums"
                style={{ minWidth: 110 }}
              >
                <span className="text-[10px] text-gray-500">$</span>{" "}
                <span className="text-[14px] font-semibold text-ink">
                  {amountFmt}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: payee + amount-in-words. Spans full check width. */}
          <div className="mt-3">
            <div className="flex items-end gap-2">
              <span className="text-[9px] uppercase tracking-wider text-gray-500">
                Pay to the order of
              </span>
              <span className="flex-1 border-b border-gray-400 pb-[1px] text-[12px] font-medium text-ink">
                {recipientName || "—"}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="flex-1 border-b border-gray-400 pb-[1px] text-[10px] italic text-gray-700">
                {amountWords || "—"}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-gray-500">
                Dollars
              </span>
            </div>
          </div>

          {/* Spacer pushes the footer to the bottom of the check */}
          <div className="flex-1" />

          {/* Footer row: memo bottom-left, signature bottom-right.
              Each block is line-on-top + label-below. The grid
              spans the full width of the check so memo sits at the
              left edge and signature at the right edge — same as
              a real business check. */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="border-b border-gray-400 pb-[2px] text-[10px] text-ink" style={{ minHeight: 16 }}>
                {memo || ""}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-500">
                Memo
              </div>
            </div>
            <div>
              <div className="border-b border-gray-400 pb-[2px]" style={{ minHeight: 16 }} />
              <div className="mt-0.5 text-right text-[9px] uppercase tracking-wider text-gray-500">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-500">
        Routing and account numbers are pulled from your verified bank
        account at print time. This preview shows the layout only.
      </div>
    </div>
  );
}

// Convert a dollar amount to USA-style words for check writing. Handles
// up to 999,999.99. Not internationalized — checks are US-only. Output
// shape: "Twenty Three and 50/100" (the "Dollars" word is rendered
// separately by the caller).
function dollarsToWords(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  const dollars = Math.floor(n);
  const cents = Math.round((n - dollars) * 100);
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  function chunk(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const r = n % 10;
      return r === 0 ? tens[t] : `${tens[t]}-${ones[r]}`;
    }
    const h = Math.floor(n / 100);
    const r = n % 100;
    return r === 0
      ? `${ones[h]} Hundred`
      : `${ones[h]} Hundred ${chunk(r)}`;
  }
  let words = "";
  const thousands = Math.floor(dollars / 1000);
  const rest = dollars % 1000;
  if (thousands > 0) {
    words = `${chunk(thousands)} Thousand`;
    if (rest > 0) words += ` ${chunk(rest)}`;
  } else {
    words = chunk(dollars);
  }
  return `${words} and ${String(cents).padStart(2, "0")}/100`;
}

// Renders every page of a PDF Blob to a stack of canvases via pdfjs-dist.
// Used by the Send Mail preview pane to show the merged-and-PDF-rendered
// letter exactly as Click2Mail will print it. pdfjs is already a project
// dependency. Worker is configured via CDN so we don't need to bundle it.
// Simple HTML-in-iframe preview for the mammoth-converted docx output.
// Sandboxed so any inline styles inside can't escape into the host page.
function HtmlDocxPreview({ blob }: { blob: Blob }) {
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    blob.text().then((text) => {
      if (!cancelled) setSrcDoc(text);
    });
    return () => {
      cancelled = true;
    };
  }, [blob]);
  if (!srcDoc) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-[11px] text-gray-500 shadow-card">
        Loading preview...
      </div>
    );
  }
  return (
    <iframe
      title="Letter preview"
      sandbox=""
      srcDoc={srcDoc}
      className="w-full rounded-md border border-gray-200 bg-white shadow-card"
      style={{ height: 680 }}
    />
  );
}

function PdfPreview({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    setPageCount(0);
    setErr(null);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Worker is served as a static file from /public so it works
        // identically in dev and production with no bundler magic and
        // no CDN dependency. Two prior approaches failed in prod:
        //   - cdnjs URL: cdnjs doesn't mirror every pdfjs-dist patch
        //     version, so 5.7.284 returned 404.
        //   - new URL(..., import.meta.url): the documented bundler
        //     pattern, but Turbopack in production didn't reliably
        //     emit the worker chunk.
        // The static-file approach is the most boring possible thing
        // and never breaks. Keep public/pdf.worker.min.mjs in sync with
        // node_modules/pdfjs-dist/build/pdf.worker.min.mjs (postinstall
        // hook below in package.json handles this on npm install).
        (
          pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }
        ).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const data = new Uint8Array(await blob.arrayBuffer());
        const doc = await (
          pdfjs as unknown as {
            getDocument: (opts: { data: Uint8Array }) => {
              promise: Promise<{
                numPages: number;
                getPage: (n: number) => Promise<{
                  getViewport: (o: { scale: number }) => {
                    width: number;
                    height: number;
                  };
                  render: (o: {
                    canvasContext: CanvasRenderingContext2D;
                    viewport: { width: number; height: number };
                  }) => { promise: Promise<void> };
                }>;
              }>;
            };
          }
        ).getDocument({ data }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.maxWidth = "850px";
          canvas.style.height = "auto";
          canvas.style.marginBottom = i === doc.numPages ? "0" : "16px";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to render PDF");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);
  return (
    <div>
      {err && (
        <div className="mb-2 rounded-md border border-danger/40 bg-red-50 p-3 text-[11px] text-danger">
          PDF render failed: {err}
        </div>
      )}
      <div ref={containerRef} className="flex flex-col items-center" />
      {pageCount > 1 && (
        <div className="mt-2 text-center text-[10px] text-gray-500">
          {pageCount} pages
        </div>
      )}
    </div>
  );
}

// Inline badge that surfaces the Lob /us_verifications result on each
// recipient row after the user clicks Send. Shows nothing pre-verify.
// Becomes clickable when there's something the customer can fix (any
// non-"deliverable" outcome) — the click opens the AddressFixPanel
// directly below the row.
function AddressBadge({
  result,
  loading,
  onClick,
}: {
  result: AddressVerifyResult | null;
  loading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  if (loading) {
    return (
      <span className="rounded-full border border-gray-200 bg-white px-2 py-[1px] text-[10px] font-medium text-gray-500">
        Re-verifying…
      </span>
    );
  }
  if (!result) return null;

  const Wrapper = onClick
    ? ({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) => (
        <button type="button" onClick={onClick} {...rest}>
          {children}
        </button>
      )
    : ({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) => (
        <span {...rest}>{children}</span>
      );

  if (!result.ok) {
    return (
      <Wrapper
        className="cursor-default rounded-full border border-gray-200 bg-white px-2 py-[1px] text-[10px] font-medium text-gray-500"
        title={result.error}
      >
        Address Check Failed
      </Wrapper>
    );
  }
  if (result.deliverability === "undeliverable") {
    return (
      <Wrapper
        className={`rounded-full border border-danger/30 bg-red-50 px-2 py-[1px] text-[10px] font-medium text-danger ${onClick ? "cursor-pointer hover:bg-red-100" : "cursor-default"}`}
        title={onClick ? "Click to see why and apply a fix" : undefined}
      >
        Undeliverable {onClick ? "·" : ""} {onClick && <span className="underline">Fix</span>}
      </Wrapper>
    );
  }
  if (
    result.deliverability === "deliverable_incorrect_unit" ||
    result.deliverability === "deliverable_missing_unit" ||
    result.deliverability === "deliverable_unnecessary_unit"
  ) {
    return (
      <Wrapper
        className={`rounded-full border border-gray-300 bg-white px-2 py-[1px] text-[10px] font-medium text-ink ${onClick ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
        title={onClick ? "Click to see the unit issue + apply a fix" : undefined}
      >
        Unit Warning {onClick ? "·" : ""} {onClick && <span className="underline">Fix</span>}
      </Wrapper>
    );
  }
  return (
    <span
      className="rounded-full border border-petrol-500/30 bg-petrol-50 px-2 py-[1px] text-[10px] font-medium text-petrol-700"
      title={
        result.test_mode
          ? "Lob test mode, verification is non-functional in dev"
          : "Address verified deliverable by Lob"
      }
    >
      {result.test_mode ? "Test Verified" : "Verified"}
    </span>
  );
}

// Inline panel that appears below a recipient row when the user
// clicks the Undeliverable / Unit Warning badge. Shows the entered
// address, Lob's suggested corrected version, plain-English issues
// pulled from the deliverability_analysis footnotes, and an Apply
// button that swaps the address and re-verifies.
function AddressFixPanel({
  original,
  result,
  onApply,
  onClose,
}: {
  original: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
  };
  result: AddressVerifyResult & { ok: true };
  onApply: (suggested: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
  }) => void;
  onClose: () => void;
}) {
  const suggested = result.normalized;
  const fmt = (a: typeof original) =>
    `${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.postal_code}`;

  return (
    <div className="border-t border-gray-150 bg-gray-50/60 px-3 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        What USPS sees
      </div>
      {result.issues.length > 0 ? (
        <ul className="mb-3 list-disc pl-5 text-[12px] text-ink">
          {result.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      ) : (
        <div className="mb-3 text-[12px] text-ink">
          USPS couldn&apos;t match this address to a delivery point.
        </div>
      )}

      <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1 text-[12px]">
        <div className="text-[10.5px] uppercase tracking-wider text-gray-500">
          You entered
        </div>
        <div className="text-ink">{fmt(original)}</div>
        {result.has_suggestion && (
          <>
            <div className="text-[10.5px] uppercase tracking-wider text-gray-500">
              Lob suggests
            </div>
            <div className="font-medium text-petrol-700">{fmt(suggested)}</div>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {result.has_suggestion && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onApply(suggested);
            }}
            className="cursor-pointer rounded-md bg-petrol-500 px-3 py-[5px] text-[11.5px] font-semibold text-white hover:bg-petrol-600"
          >
            Use Lob&apos;s version
          </button>
        )}
        {!result.has_suggestion && (
          <div className="text-[11.5px] text-gray-600">
            Lob doesn&apos;t have a suggested correction for this address.
            Edit the address from the Contacts tab, then re-open Send Mail.
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-[5px] text-[11.5px] font-medium text-ink hover:border-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function FieldPicker({ onInsert }: { onInsert: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] font-medium text-ink hover:border-petrol-500"
      >
        Insert Field {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 max-h-[360px] w-[300px] overflow-y-auto rounded-md border border-gray-200 bg-surface shadow-card">
          {(["recipient", "lead", "sender", "system"] as const).map((group) => {
            const fields = MERGE_FIELDS.filter((f) => f.group === group);
            if (fields.length === 0) return null;
            return (
              <div key={group}>
                <div className="border-b border-petrol-100 bg-petrol-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-petrol-700">
                  {MERGE_GROUP_LABELS[group]}
                </div>
                {fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    title={`e.g. ${f.example}`}
                    onClick={() => {
                      onInsert(f.key);
                      setOpen(false);
                    }}
                    className="block w-full cursor-pointer px-3 py-[5px] text-left hover:bg-petrol-50"
                  >
                    <div className="text-[11px] leading-tight text-ink">{f.label}</div>
                    <div className="truncate text-[10px] italic leading-tight text-gray-400">
                      e.g. {f.example}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PreviewPane({
  recipients,
  body,
  buildContext,
  idx,
  setIdx,
  color,
  checkInfo,
  fileTemplate,
  templateId,
  fromAddress,
  onBack,
  onSend,
  sendDisabled,
  sendLabel,
  sendErr,
}: {
  recipients: SendMailModalRecipient[];
  body: string;
  buildContext: (
    r: SendMailModalRecipient
  ) => Record<string, string | number | null | undefined>;
  idx: number;
  setIdx: (n: number) => void;
  color: boolean;
  checkInfo: {
    amountDollars: string;
    memo: string;
    bankLabel: string;
    fromName: string;
    fromLine1: string;
    fromCityStateZip: string;
  } | null;
  fileTemplate: { name: string; attachmentNames: string[] } | null;
  templateId: string | null;
  fromAddress: SendMailFromAddress;
  onBack: () => void;
  onSend: () => void;
  sendDisabled: boolean;
  sendLabel: string;
  sendErr: string | null;
}) {
  const recipient = recipients[idx];
  const rendered =
    recipient && !fileTemplate
      ? renderMerge(body, buildContext(recipient))
      : "";

  // For file templates: fetch the merged preview from the server. The
  // server runs docxtemplater + sends the result to Gotenberg (LibreOffice
  // headless) which converts to PDF. PDF preview is what the printer
  // actually mails, so pixel accuracy here = pixel accuracy in the
  // recipient's mailbox. Falls back to docx if Gotenberg isn't configured.
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewKind, setPreviewKind] = useState<"pdf" | "html">("pdf");
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxErr, setDocxErr] = useState<string | null>(null);
  useEffect(() => {
    if (!fileTemplate || !recipient || !templateId) {
      setPreviewBlob(null);
      return;
    }
    let cancelled = false;
    setDocxLoading(true);
    setDocxErr(null);
    setPreviewBlob(null);
    (async () => {
      const res = await previewMailMergeDocx({
        template_id: templateId,
        recipient_merge_context: buildContext(recipient),
      });
      if (cancelled) return;
      if (!res.ok) {
        setDocxErr(res.error);
        setDocxLoading(false);
        return;
      }
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      setPreviewKind(res.kind);
      setPreviewBlob(
        new Blob([bytes], {
          type: res.kind === "pdf" ? "application/pdf" : "text/html",
        })
      );
      setDocxLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTemplate?.name, recipient?.key, templateId]);
  return (
    <div className="space-y-3">
      {/* Prominent STICKY error banner at the TOP of the preview pane
          (same style as the form view's banner). Pins to the top of
          the scroll container while the user scrolls through the
          letter render, so the error is always visible regardless of
          where they were when they clicked Send. */}
      {sendErr && (
        <div
          role="alert"
          className="sticky top-0 z-20 flex items-start gap-2.5 rounded-md border-2 border-danger/40 bg-red-50 px-3.5 py-2.5"
          style={{ boxShadow: "0 4px 12px rgba(180, 35, 24, 0.18)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-danger"
            style={{ marginTop: 1 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
          </svg>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-danger">
              Can&apos;t send yet
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium text-danger">
              {sendErr}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] font-medium text-ink hover:border-petrol-500"
        >
          ← Back to editor
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-[2px] text-[10px] font-medium uppercase tracking-wide ${
              color
                ? "border-petrol-200 bg-petrol-50 text-petrol-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {color ? "Color Print" : "Black & White"}
          </span>
          {recipients.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIdx(Math.max(0, idx - 1))}
                disabled={idx === 0}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink disabled:opacity-40"
              >
                ←
              </button>
              <div className="text-[11px] text-gray-500">
                {idx + 1} / {recipients.length}
              </div>
              <button
                type="button"
                onClick={() => setIdx(Math.min(recipients.length - 1, idx + 1))}
                disabled={idx >= recipients.length - 1}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink disabled:opacity-40"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>
      {/* Envelope-shaped preview chrome — From in upper-left, To centered
          lower, stamp box upper-right. Makes it visually obvious what
          this is before reading the paper. */}
      <div
        className="relative mx-auto w-full max-w-[640px] rounded-md border border-gray-300 bg-white px-4 py-3 shadow-sm"
        style={{ aspectRatio: "2.3 / 1" }}
      >
        {/* Stamp box — top right corner */}
        <div className="absolute right-3 top-3 flex h-10 w-12 items-center justify-center rounded-sm border-2 border-dashed border-gray-300 text-[8px] uppercase tracking-wide text-gray-400">
          Postage
        </div>

        {/* Return address — top left */}
        <div className="text-[10px] leading-tight text-ink">
          <div className="font-medium">{fromAddress.name}</div>
          <div>{fromAddress.line1}</div>
          {fromAddress.line2 && <div>{fromAddress.line2}</div>}
          <div>
            {fromAddress.city}, {fromAddress.region} {fromAddress.postal_code}
          </div>
        </div>

        {/* Recipient — block is centered on the envelope, but address
            LINES are left-aligned like a real mailing label. */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-left text-[11px] leading-snug text-ink">
          <div className="font-medium">{recipient?.contact.full_name}</div>
          <div>{recipient?.contact.line1}</div>
          {recipient?.contact.line2 && (
            <div>{recipient.contact.line2}</div>
          )}
          <div>
            {recipient?.contact.city}, {recipient?.contact.state}{" "}
            {recipient?.contact.postal_code}
          </div>
        </div>
      </div>

      {fileTemplate && fileTemplate.attachmentNames.length > 0 && (
        <div className="mx-auto max-w-[640px] text-[10px] text-gray-500">
          Inside: 1. {fileTemplate.name}
          {fileTemplate.attachmentNames.map((n, i) => (
            <span key={n}>
              {" "}
              · {i + 2}. {n}
            </span>
          ))}
        </div>
      )}

      {/* Check sample — only when the user has toggled "Include a check
          with this letter". Visual mock-up of what Lob will physically
          print, so the user verifies payee + amount + memo before send.
          Lob's actual check layout is similar (top half = check, bottom
          half = letter); we show the check above the letter pane. */}
      {checkInfo && recipient && (
        <CheckSample
          recipientName={recipient.contact.full_name}
          amountDollars={checkInfo.amountDollars}
          memo={checkInfo.memo}
          bankLabel={checkInfo.bankLabel}
          fromName={checkInfo.fromName}
          fromLine1={checkInfo.fromLine1}
          fromCityStateZip={checkInfo.fromCityStateZip}
          dateLabel={new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        />
      )}

      {/* Paper preview. SuperDoc renders the merged docx in viewing mode
          (editing it inline would diverge from the saved template — to
          change wording, edit the template in Settings). HTML bodies
          render on a scaled-down 8.5×11 page so margins and proportion
          read as a real letter, not a giant block of text. */}
      <div
        className="flex justify-center"
        style={color ? undefined : { filter: "grayscale(100%)" }}
      >
        {fileTemplate ? (
          <div className="w-full">
            {docxLoading ? (
              <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-[11px] text-gray-500 shadow-card">
                Rendering merged document...
              </div>
            ) : docxErr ? (
              <div className="rounded-md border border-danger/40 bg-red-50 p-3 text-[11px] text-danger">
                Preview failed: {docxErr}
              </div>
            ) : previewBlob ? (
              previewKind === "pdf" ? (
                <PdfPreview blob={previewBlob} />
              ) : (
                <HtmlDocxPreview blob={previewBlob} />
              )
            ) : null}
          </div>
        ) : (
          <div
            className="bg-white"
            style={{
              // Scaled 8.5x11 — 0.6 scale so a single page fits inside
              // the modal without horizontal scroll. Real margins (1in)
              // are preserved at the scaled rate (~58px) so the body
              // sits where it would on actual paper. Visible border +
              // drop shadow so the white paper reads as a physical
              // page against the also-white modal background (the
              // earlier shadow-card alone was too subtle).
              width: "510px",
              minHeight: "660px",
              padding: "58px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "10pt",
              lineHeight: 1.5,
              color: "#0f1729",
              border: "1px solid #d4d8dd",
              boxShadow: "0 4px 16px rgba(15, 23, 41, 0.08)",
            }}
          >
            <pre
              className="whitespace-pre-wrap"
              style={{
                fontFamily: "inherit",
                fontSize: "inherit",
                lineHeight: "inherit",
                margin: 0,
              }}
            >
              {rendered}
            </pre>
          </div>
        )}
      </div>

      {/* Send footer — error is rendered at the TOP of the pane (banner
          above) so it can't be missed. Footer is just the action. */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-1 pt-3">
        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled}
          className="cursor-pointer rounded-md btn-primary px-4 py-[7px] text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {sendLabel}
        </button>
      </div>
    </div>
  );
}
