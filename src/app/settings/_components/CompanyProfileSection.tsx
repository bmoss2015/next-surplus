"use client";

// Settings clone · Phase C.4 — Company Profile wired to real data.
//
// All OrgInfo fields are editable except Tax ID (EIN) and Logo upload —
// those need migration 0115 (orgs.tax_id_ein + orgs.logo_url + storage
// buckets). Save Changes / Discard buttons appear when the form is dirty
// and call updateOrgInfo as a single transaction.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrgInfo } from "@/app/(app)/settings/_actions";
import type { OrgInfo } from "@/lib/settings/fetch";

export function CompanyProfileSection({ initial }: { initial: OrgInfo }) {
  const router = useRouter();
  const [form, setForm] = useState<OrgInfo>(initial);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const ready = form.name.trim().length > 0;

  function set<K extends keyof OrgInfo>(key: K, value: OrgInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    setErrMsg(null);
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
    setSaving(false);
    if (!res.ok) {
      setErrMsg(res.error);
      return;
    }
    router.refresh();
  }

  const initials = (form.name || form.legal_name || "Org")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "ORG";

  return (
    <section id="panel-company" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Workspace</a>
        <i className="icon icon-chevron-right" />
        <span>Company Profile</span>
      </div>

      <div className="clean-hero">
        <div
          className="clean-hero-avatar"
          style={{ fontSize: 14, letterSpacing: "0.04em" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="clean-hero-title">{form.name || "Your Organization"}</div>
          <div className="clean-hero-meta">
            {form.legal_name ?? ""}
            {form.legal_name && form.city ? " · " : ""}
            {form.city && form.region ? `${form.city}, ${form.region}` : form.city ?? ""}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm clean-hero-upload"
          disabled
          title="Logo upload lands once migration 0115 applies to staging"
        >
          Upload Logo
        </button>
      </div>

      <PrefRow title="Organization Name">
        <input
          className="input pref-row-input"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </PrefRow>
      <PrefRow
        title="Legal Name"
        desc="The name on file with the IRS. Shown on contracts and tax forms."
      >
        <input
          className="input pref-row-input"
          value={form.legal_name ?? ""}
          onChange={(e) => set("legal_name", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="Email">
        <input
          className="input pref-row-input"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="Phone">
        <input
          className="input pref-row-input"
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => set("phone", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="Website">
        <input
          className="input pref-row-input"
          value={form.website ?? ""}
          onChange={(e) => set("website", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="Address">
        <input
          className="input pref-row-input"
          value={form.address_line1 ?? ""}
          onChange={(e) => set("address_line1", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="Address Line 2">
        <input
          className="input pref-row-input"
          value={form.address_line2 ?? ""}
          onChange={(e) => set("address_line2", e.target.value || null)}
        />
      </PrefRow>
      <PrefRow title="City, State, ZIP">
        <div
          className="flex items-center gap-2 pref-row-input"
          style={{ width: 320 }}
        >
          <input
            className="input"
            value={form.city ?? ""}
            placeholder="City"
            onChange={(e) => set("city", e.target.value || null)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            className="input"
            value={form.region ?? ""}
            placeholder="ST"
            maxLength={2}
            onChange={(e) => set("region", e.target.value.toUpperCase() || null)}
            style={{ width: 60 }}
          />
          <input
            className="input"
            value={form.postal_code ?? ""}
            placeholder="ZIP"
            onChange={(e) => set("postal_code", e.target.value || null)}
            style={{ width: 90 }}
          />
        </div>
      </PrefRow>
      <PrefRow title="Tax ID (EIN)" desc="00-0000000 format. Needs migration 0115.">
        <input
          className="input pref-row-input"
          disabled
          placeholder="00-0000000"
        />
      </PrefRow>

      {(dirty || errMsg) && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!ready || saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={saving}
            onClick={() => {
              setForm(initial);
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

function PrefRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pref-row">
      <div className="flex-1 min-w-0">
        <div className="pref-row-title">{title}</div>
        {desc && <div className="pref-row-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}
