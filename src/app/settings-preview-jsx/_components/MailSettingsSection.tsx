"use client";

// Settings clone · Phase C.4 — Mail Configuration wired to real data.
//
// Three savable fields — Signer Name, Signer Title, Default Mail Class.
// Signature image upload is intentionally not wired here (it uses
// uploadSignatureImage with a multipart FormData flow); Phase D ports it
// over. The script-font signature preview just renders the signer name in
// "Brush Script MT" for visual feedback until then.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMailSettings } from "@/app/(app)/settings/_actions";
import type { MailSettings } from "@/lib/settings/fetch";

export function MailSettingsSection({
  initial,
}: {
  initial: MailSettings;
}) {
  const router = useRouter();
  const [signerName, setSignerName] = useState(initial.signer_name ?? "");
  const [signerTitle, setSignerTitle] = useState(initial.signer_title ?? "");
  const [mailClass, setMailClass] = useState(initial.default_mail_class);
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
            Sender identity and class used when the portal mails letters via
            Click2Mail.
          </p>
        </div>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Signer Name</div>
          <div className="pref-row-desc">
            Printed under the signature line on every outgoing letter.
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
        </div>
        <input
          className="input pref-row-input"
          value={signerTitle}
          onChange={(e) => setSignerTitle(e.target.value)}
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Default Mail Class</div>
          <div className="pref-row-desc">
            Standard for cold outreach. First-Class for replies. Certified
            for legal notice.
          </div>
        </div>
        <select
          className="input pref-row-input"
          value={mailClass}
          onChange={(e) =>
            setMailClass(e.target.value as MailSettings["default_mail_class"])
          }
        >
          <option value="standard">Standard</option>
          <option value="first_class">First Class</option>
          <option value="certified">Certified</option>
        </select>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Signature Image</div>
          <div className="pref-row-desc">
            Upload a signed PNG to use on outgoing letters. Phase D ships
            the upload flow.
          </div>
        </div>
        <div className="pref-row-input" style={{ width: 320 }}>
          {signerName ? (
            <span
              style={{
                fontFamily: "'Brush Script MT', cursive",
                fontSize: 32,
                color: "var(--ink)",
                transform: "rotate(-3deg)",
                display: "inline-block",
              }}
            >
              {signerName}
            </span>
          ) : (
            <span style={{ color: "var(--text-3)", fontSize: 12.5 }}>
              Sign-in name once Signer Name is set above.
            </span>
          )}
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
