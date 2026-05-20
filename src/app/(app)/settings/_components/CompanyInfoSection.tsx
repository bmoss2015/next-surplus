"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrgInfo } from "../_actions";
import { useSavePill } from "@/components/SavePillProvider";
import type { OrgInfo } from "@/lib/settings/fetch";

// Settings redesign — Company Profile panel (was Company Info).
// Adds visual rebuild + Tax ID (EIN) and Logo upload placeholders.
// EIN / logo wiring lands once migration 0115 + storage policies are applied.
export function CompanyInfoSection({ initial }: { initial: OrgInfo }) {
  const router = useRouter();
  const [form, setForm] = useState<OrgInfo>(initial);

  function set<K extends keyof OrgInfo>(key: K, value: OrgInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function s(v: string | null) {
    return v ?? "";
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const ready = form.name.trim().length > 0;

  useSavePill({
    key: "company",
    dirty: dirty && ready,
    save: async () => {
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
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    },
    discard: () => setForm(initial),
  });

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  const initials = (form.name || form.legal_name || "Org")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "ORG";

  const cityLine = [form.city, form.region].filter((x) => x && x.trim()).join(", ");

  return (
    <div className="col-span-2">
      <h2 className="section-subheader mb-0">Company Profile</h2>

      <div className="clean-hero">
        <div
          className="clean-hero-avatar"
          style={{ fontSize: 14, letterSpacing: "0.04em" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="clean-hero-title">{form.legal_name || form.name || "Your Company"}</div>
          <div className="clean-hero-meta">
            Workspace{cityLine ? ` · ${cityLine}` : ""}
          </div>
        </div>
        <button
          type="button"
          className="clean-hero-upload rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[12.5px] font-medium text-ink hover:border-gray-300"
          title="Coming soon"
          disabled
        >
          Upload Logo
        </button>
      </div>

      <div>
        <div className="pref-section-h">Identity</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Legal Name</div>
            <div className="pref-row-desc">
              Your registered entity. Appears on contracts and official mail.
            </div>
          </div>
          <input
            type="text"
            value={s(form.legal_name)}
            onChange={(e) => set("legal_name", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
            placeholder="Moss Equity Partners LLC"
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Display Name</div>
            <div className="pref-row-desc">
              The brand name shown on letters and emails.
            </div>
          </div>
          <input
            type="text"
            value={s(form.name)}
            onChange={(e) => set("name", e.target.value)}
            className={`pref-row-input ${inputClass}`}
            placeholder="Moss Equity"
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Tax ID (EIN)</div>
            <div className="pref-row-desc">
              Used on 1099s and tax documents issued from the portal.
            </div>
          </div>
          <input
            type="text"
            disabled
            placeholder="00-0000000"
            className={`pref-row-input ${inputClass}`}
            title="Saves once the next migration applies to staging."
          />
        </div>

        <div className="pref-section-h">Contact</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Email</div></div>
          <input
            type="email"
            value={s(form.email)}
            onChange={(e) => set("email", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Phone</div></div>
          <input
            type="tel"
            value={s(form.phone)}
            onChange={(e) => set("phone", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Website</div></div>
          <input
            type="url"
            placeholder="https://"
            value={s(form.website)}
            onChange={(e) => set("website", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>

        <div className="pref-section-h">Mailing Address</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Address Line 1</div></div>
          <input
            type="text"
            value={s(form.address_line1)}
            onChange={(e) => set("address_line1", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Address Line 2</div></div>
          <input
            type="text"
            placeholder="Suite, floor, or unit (optional)"
            value={s(form.address_line2)}
            onChange={(e) => set("address_line2", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">City, State, Postal Code</div></div>
          <div className="flex items-center gap-2 pref-row-input">
            <input
              type="text"
              placeholder="City"
              value={s(form.city)}
              onChange={(e) => set("city", e.target.value || null)}
              className={inputClass}
              style={{ flex: 1, minWidth: 0 }}
            />
            <input
              type="text"
              maxLength={2}
              placeholder="ST"
              value={s(form.region)}
              onChange={(e) => set("region", e.target.value.toUpperCase() || null)}
              className={inputClass}
              style={{ width: 60 }}
            />
            <input
              type="text"
              placeholder="00000"
              value={s(form.postal_code)}
              onChange={(e) => set("postal_code", e.target.value || null)}
              className={inputClass}
              style={{ width: 90 }}
            />
          </div>
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1"><div className="pref-row-title">Country</div></div>
          <input
            type="text"
            placeholder="United States"
            value={s(form.country)}
            onChange={(e) => set("country", e.target.value || null)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>

      </div>
    </div>
  );
}
