"use client";

// Settings clone · Phase C.6 — Mail Configuration restructured to match
// mockup.
//
// Layout (in render order, per the mockup at /settings-preview):
//   1. Signature Preview hero — paper card on the left with the script
//      signature, signer name, signer title; eyebrow + caption +
//      Replace/Remove on the right.
//   2. Signer section — Signer Name + Signer Title pref-rows with merge-
//      field tips.
//   3. Default Mail Class section — radio-card grid (Standard / First
//      Class / Certified) with copy under each label.
//
// Saves Signer Name / Signer Title / Default Mail Class via
// updateMailSettings. Signature image upload is still deferred to Phase D
// (multipart FormData flow).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMailSettings } from "@/app/(app)/settings/_actions";
import type { MailSettings } from "@/lib/settings/fetch";

type MailClass = MailSettings["default_mail_class"];

const CLASSES: { value: MailClass; label: string; desc: string }[] = [
  {
    value: "standard",
    label: "Standard",
    desc: "Cheapest · 3–10 days · basic tracking",
  },
  {
    value: "first_class",
    label: "First Class",
    desc: "1–5 days · USPS tracking",
  },
  {
    value: "certified",
    label: "Certified",
    desc: "Tracked · proof of receipt",
  },
];

export function MailSettingsSection({
  initial,
}: {
  initial: MailSettings;
}) {
  const router = useRouter();
  const [signerName, setSignerName] = useState(initial.signer_name ?? "");
  const [signerTitle, setSignerTitle] = useState(initial.signer_title ?? "");
  const [mailClass, setMailClass] = useState<MailClass>(
    initial.default_mail_class
  );
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const dirty =
    (signerName.trim() || null) !== initial.signer_name ||
    (signerTitle.trim() || null) !== initial.signer_title ||
    mailClass !== initial.default_mail_class;

  async function onSave() {
    setSaving(true);
    setErrMsg(null);
    const res = await updateMailSettings({
      signer_name: signerName.trim() || null,
      signer_title: signerTitle.trim() || null,
      default_mail_class: mailClass,
    });
    setSaving(false);
    if (!res.ok) {
      setErrMsg(res.error);
      return;
    }
    router.refresh();
  }

  const previewName = signerName || "Your Name";
  const previewTitle = signerTitle ? `${signerTitle} · ${initial.signer_title ? "" : ""}` : "";

  return (
    <section id="panel-mail-settings" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Mail</a>
        <i className="icon icon-chevron-right" />
        <span>Configuration</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Mail Configuration</h1>
          <p className="section-desc">
            Signer, signature, and default postal class applied to every
            outgoing letter.
          </p>
        </div>
      </div>

      {/* Signature preview hero — visual focal point at the top. */}
      <div className="sig-hero">
        <div className="sig-hero-paper">
          <div className="sig-hero-image">
            {initial.signature_image_url ? (
              <img
                src={initial.signature_image_url}
                alt="Signature"
                style={{ maxHeight: 60, maxWidth: "100%" }}
              />
            ) : (
              <span
                style={{
                  fontFamily: "'Brush Script MT', cursive",
                  fontSize: 40,
                  color: "var(--ink)",
                  transform: "rotate(-3deg)",
                  display: "inline-block",
                }}
              >
                {previewName}
              </span>
            )}
          </div>
          <div className="sig-hero-name">{previewName}</div>
          <div className="sig-hero-title">
            {signerTitle ? signerTitle : "Signer Title"}
          </div>
        </div>
        <div className="sig-hero-actions">
          <div className="sig-hero-eyebrow">Signature Preview</div>
          <div className="sig-hero-caption">
            Inserted into the signature block of every outgoing letter,
            wherever your template&apos;s{" "}
            <code>{"{{signature}}"}</code> merge field appears.
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled
              title="Upload flow ships in Phase D"
            >
              {initial.signature_image_path ? "Replace Image" : "Upload Image"}
            </button>
            {initial.signature_image_path && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled
                title="Remove ships in Phase D"
                style={{ color: "var(--danger)" }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pref-section-h">Signer</div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Signer Name</div>
          <div className="pref-row-desc">
            Available in every letter template as the{" "}
            <code>{"{{signer_name}}"}</code> merge field.
          </div>
        </div>
        <input
          className="input pref-row-input"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Signer Title</div>
          <div className="pref-row-desc">
            Available as the <code>{"{{signer_title}}"}</code> merge field.
            Leave blank to omit.
          </div>
        </div>
        <input
          className="input pref-row-input"
          value={signerTitle}
          onChange={(e) => setSignerTitle(e.target.value)}
        />
      </div>

      <div className="pref-section-h">Default Mail Class</div>
      <div
        style={{
          padding: "18px 0",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div className="mail-class-grid">
          {CLASSES.map((c) => (
            <label
              key={c.value}
              className={
                "mail-class-card" + (mailClass === c.value ? " selected" : "")
              }
            >
              <input
                type="radio"
                name="mail-class"
                value={c.value}
                checked={mailClass === c.value}
                onChange={() => setMailClass(c.value)}
              />
              <div className="mail-class-label">{c.label}</div>
              <div className="mail-class-desc">{c.desc}</div>
            </label>
          ))}
        </div>
      </div>

      {(dirty || errMsg) && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={saving}
            onClick={() => {
              setSignerName(initial.signer_name ?? "");
              setSignerTitle(initial.signer_title ?? "");
              setMailClass(initial.default_mail_class);
              setErrMsg(null);
            }}
          >
            Discard
          </button>
          {errMsg && (
            <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {errMsg}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
