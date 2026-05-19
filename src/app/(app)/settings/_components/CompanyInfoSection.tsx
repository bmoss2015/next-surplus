"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgInfo } from "../_actions";
import type { OrgInfo } from "@/lib/settings/fetch";

export function CompanyInfoSection({ initial }: { initial: OrgInfo }) {
  const router = useRouter();
  const [form, setForm] = useState<OrgInfo>(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  function set<K extends keyof OrgInfo>(key: K, value: OrgInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function s(v: string | null) {
    return v ?? "";
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const ready = form.name.trim().length > 0;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!ready) {
      setMsg({ kind: "err", text: "Company name is required." });
      return;
    }
    startTransition(async () => {
      const res = await updateOrgInfo({
        name: form.name.trim(),
        legal_name: form.legal_name,
        email: form.email,
        phone: form.phone,
        website: form.website,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        region: form.region,
        postal_code: form.postal_code,
        country: form.country,
      });
      if (res.ok) {
        setMsg({ kind: "ok", text: "Company information updated." });
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
        <h2 className="section-subheader">Company Information</h2>
        <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
          Used on outgoing letters, email footers, and generated agreements.
        </div>
      </div>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Legal Name</label>
            <input
              type="text"
              value={s(form.legal_name)}
              onChange={(e) => set("legal_name", e.target.value || null)}
              className={inputClass}
              placeholder="Moss Equity Partners LLC"
            />
            <div className="text-[10px] text-gray-400">
              Your registered entity (LLC, Corp) — appears on contracts and
              official mail.
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={s(form.name)}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="Moss Equity"
            />
            <div className="text-[10px] text-gray-400">
              The brand name shown on letters and emails. Leave blank to use
              your legal name.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={s(form.email)}
              onChange={(e) => set("email", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={s(form.phone)}
              onChange={(e) => set("phone", e.target.value || null)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Website</label>
          <input
            type="url"
            placeholder="https://"
            value={s(form.website)}
            onChange={(e) => set("website", e.target.value || null)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Address Line 1</label>
          <input
            type="text"
            value={s(form.address_line1)}
            onChange={(e) => set("address_line1", e.target.value || null)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Address Line 2</label>
          <input
            type="text"
            value={s(form.address_line2)}
            onChange={(e) => set("address_line2", e.target.value || null)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-[1fr_120px_140px] gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={s(form.city)}
              onChange={(e) => set("city", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>State</label>
            <input
              type="text"
              maxLength={2}
              value={s(form.region)}
              onChange={(e) =>
                set("region", e.target.value.toUpperCase() || null)
              }
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Postal Code</label>
            <input
              type="text"
              value={s(form.postal_code)}
              onChange={(e) => set("postal_code", e.target.value || null)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Country</label>
          <input
            type="text"
            placeholder="United States"
            value={s(form.country)}
            onChange={(e) => set("country", e.target.value || null)}
            className={inputClass}
          />
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
            disabled={pending || !ready || !dirty}
            className="cursor-pointer rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
