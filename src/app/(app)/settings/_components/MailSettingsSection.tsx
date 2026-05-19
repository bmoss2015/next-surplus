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
  {
    value: "standard",
    label: "Standard",
    description: "Cheapest, 3-10 days, basic tracking",
  },
  {
    value: "first_class",
    label: "First Class",
    description: "Default, 1-5 days, USPS tracking",
  },
  {
    value: "certified",
    label: "Certified",
    description: "Tracked with proof of receipt",
  },
];

export function MailSettingsSection({ initial }: { initial: MailSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [sigPending, startSigTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [sigMsg, setSigMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
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

  function s(v: string | null) {
    return v ?? "";
  }

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
  const labelClass = "text-[11px] font-medium text-gray-500";

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h2 className="section-subheader">Mail Settings</h2>
        <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
          Signer details and default postal class for outgoing letters.
        </div>
      </div>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Signer Name</label>
            <input
              type="text"
              value={s(form.signer_name)}
              onChange={(e) => set("signer_name", e.target.value || null)}
              className={inputClass}
              placeholder="Bree Moss"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Signer Title</label>
            <input
              type="text"
              value={s(form.signer_title)}
              onChange={(e) => set("signer_title", e.target.value || null)}
              className={inputClass}
              placeholder="Managing Partner"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Signature Image</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragOver) setDragOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              // Only clear when leaving the outer wrapper, not when crossing
              // into a child element.
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOver(false);
            }}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed p-3 transition-colors ${
              dragOver
                ? "border-petrol-500 bg-petrol-500/5"
                : "border-gray-300 hover:border-petrol-500/50"
            }`}
          >
            <div className="flex h-16 w-40 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white">
              {initial.signature_image_url ? (
                // Inline preview using the signed URL resolved on the server.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initial.signature_image_url}
                  alt="Signature preview"
                  className="max-h-14 max-w-[140px] object-contain"
                />
              ) : (
                <span className="text-[11px] text-gray-400">No signature</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[12px] font-medium text-ink">
                {dragOver
                  ? "Drop to upload"
                  : "Drag and drop an image, or click to browse"}
              </div>
              <div className="text-[11px] text-gray-500">
                PNG or JPEG, 5 MB max. Transparent PNG works best.
              </div>
              {initial.signature_image_path && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSignature();
                  }}
                  disabled={sigPending}
                  className="mt-1 w-fit cursor-pointer text-[11px] text-danger hover:underline disabled:opacity-50"
                >
                  Remove signature
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
          </div>
          {sigMsg && (
            <div
              className={`text-[12px] ${
                sigMsg.kind === "ok" ? "text-success" : "text-danger"
              }`}
            >
              {sigMsg.text}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Default Mail Class</label>
          <div className="grid grid-cols-3 gap-2">
            {MAIL_CLASS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-2 transition-colors ${
                  form.default_mail_class === opt.value
                    ? "border-petrol-500 bg-petrol-500/5"
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
                  <span className="text-[13px] font-medium text-ink">
                    {opt.label}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500">
                  {opt.description}
                </div>
              </label>
            ))}
          </div>
        </div>

        {msg && (
          <div
            className={`text-[12px] ${
              msg.kind === "ok" ? "text-success" : "text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="flex justify-end pt-1">
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
