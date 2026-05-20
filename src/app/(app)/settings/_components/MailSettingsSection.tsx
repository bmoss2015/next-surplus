"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeSignatureImage,
  updateMailSettings,
  uploadSignatureImage,
} from "../_actions";
import type { MailSettings } from "@/lib/settings/fetch";

const MAIL_CLASS_OPTIONS: {
  value: MailSettings["default_mail_class"];
  label: string;
  description: string;
}[] = [
  { value: "standard",    label: "Standard",    description: "Cheapest · 3–10 days · basic tracking" },
  { value: "first_class", label: "First Class", description: "1–5 days · USPS tracking" },
  { value: "certified",   label: "Certified",   description: "Tracked · proof of receipt" },
];

// Settings redesign — Mail Configuration panel.
// Signature preview hero + minimal pref-rows. Functional drag-and-drop image
// upload preserved; visual chrome rewritten to match the new design language.
export function MailSettingsSection({ initial }: { initial: MailSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [sigPending, startSigTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [sigMsg, setSigMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    if (file.size === 0) return;
    if (file.size > 5 * 1024 * 1024) {
      setSigMsg({ kind: "err", text: "Image must be 5 MB or smaller" });
      return;
    }
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setSigMsg({ kind: "err", text: "Use a PNG or JPEG image" });
      return;
    }
    setSigMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    startSigTransition(async () => {
      const res = await uploadSignatureImage(fd);
      if (res.ok) {
        setSigMsg({ kind: "ok", text: "Signature uploaded." });
        router.refresh();
      } else {
        setSigMsg({ kind: "err", text: res.error });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  }

  function onRemoveSignature() {
    setSigMsg(null);
    startSigTransition(async () => {
      const res = await removeSignatureImage();
      if (res.ok) {
        setSigMsg({ kind: "ok", text: "Signature removed." });
        router.refresh();
      } else {
        setSigMsg({ kind: "err", text: res.error });
      }
    });
  }

  function set<K extends keyof MailSettings>(key: K, value: MailSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function s(v: string | null) { return v ?? ""; }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateMailSettings({
        signer_name: form.signer_name,
        signer_title: form.signer_title,
        default_mail_class: form.default_mail_class,
      });
      if (res.ok) {
        setMsg({ kind: "ok", text: "Mail settings saved." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Mail Configuration</h2>
      <div className="mt-1 text-[12.5px] text-gray-500">
        Signer, signature, and default postal class applied to every outgoing letter.
      </div>

      {/* Signature preview hero */}
      <div className="mt-5 grid gap-6" style={{ gridTemplateColumns: "1fr 240px", alignItems: "stretch" }}>
        <div className="sig-hero-paper">
          <div style={{ minHeight: 60, marginBottom: 8 }}>
            {initial.signature_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={initial.signature_image_url} alt="Signature preview" style={{ maxHeight: 60, maxWidth: 220, objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 40, color: "#0a0d14", display: "inline-block", transform: "rotate(-3deg)" }}>
                {s(form.signer_name) || "Your Signature"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0d14", letterSpacing: "-0.01em" }}>
            {s(form.signer_name) || "Signer Name"}
          </div>
          {s(form.signer_title) && (
            <div style={{ fontSize: 12.5, color: "#5b606a", marginTop: 2 }}>{form.signer_title}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9298a3", marginBottom: 6 }}>
            Signature Preview
          </div>
          <div style={{ fontSize: 12.5, color: "#5b606a", lineHeight: 1.5 }}>
            Inserted wherever your letter template uses the <code>{`{{signature}}`}</code> merge field.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sigPending}
              className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12px] font-medium text-ink hover:border-gray-300 disabled:opacity-50"
            >
              {initial.signature_image_path ? "Replace Image" : "Upload Image"}
            </button>
            {initial.signature_image_path && (
              <button
                type="button"
                onClick={onRemoveSignature}
                disabled={sigPending}
                className="rounded-md bg-transparent px-3 py-[6px] text-[12px] font-medium text-danger hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onPickFile}
            disabled={sigPending}
            className="hidden"
          />
          {sigMsg && (
            <div className={`mt-2 text-[11px] ${sigMsg.kind === "ok" ? "text-success" : "text-danger"}`}>
              {sigMsg.text}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={save}>
        <div className="pref-section-h">Signer</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Signer Name</div>
            <div className="pref-row-desc">Available in every letter template as the <code>{`{{signer_name}}`}</code> merge field.</div>
          </div>
          <input
            type="text"
            value={s(form.signer_name)}
            onChange={(e) => set("signer_name", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
            placeholder="Bree Moss"
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Signer Title</div>
            <div className="pref-row-desc">Available as the <code>{`{{signer_title}}`}</code> merge field. Leave blank to omit.</div>
          </div>
          <input
            type="text"
            value={s(form.signer_title)}
            onChange={(e) => set("signer_title", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
            placeholder="Managing Partner"
          />
        </div>

        <div className="pref-section-h">Default Mail Class</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {MAIL_CLASS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-2 transition-colors ${
                form.default_mail_class === opt.value
                  ? "border-ink bg-gray-50"
                  : "border-gray-200 bg-surface hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="default_mail_class"
                  value={opt.value}
                  checked={form.default_mail_class === opt.value}
                  onChange={() => set("default_mail_class", opt.value)}
                  className="cursor-pointer"
                />
                <span className="text-[13px] font-medium text-ink">{opt.label}</span>
              </div>
              <div className="text-[11px] text-gray-500">{opt.description}</div>
            </label>
          ))}
        </div>

        {msg && (
          <div className={`mt-3 text-[12px] ${msg.kind === "ok" ? "text-success" : "text-danger"}`}>
            {msg.text}
          </div>
        )}
        <div className="mt-4 flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={pending || !dirty}
            className="cursor-pointer rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
