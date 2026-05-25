"use client";

// Settings clone · Phase E.3 — Company Profile fully wired.
//
// Org name/legal/email/phone/website/address all save via updateOrgInfo
// in a single Save Changes click. Logo upload + Tax ID (EIN) are now
// live too (migration 0118): logo uploads via uploadOrgLogo, EIN persists
// via setOrgTaxId on blur.

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgInfo } from "@/app/(app)/settings/_actions";
import { useSaveBarSection } from "@/components/SettingsSaveBar";
import {
  uploadOrgLogo,
  removeOrgLogo,
  setOrgTaxId,
} from "@/app/(app)/settings/_upload-actions";
import type { OrgInfo } from "@/lib/settings/fetch";

export function CompanyProfileSection({ initial }: { initial: OrgInfo }) {
  const router = useRouter();
  const [form, setForm] = useState<OrgInfo>(initial);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [ein, setEin] = useState(initial.tax_id_ein ?? "");
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  // dirty/ready compare against the non-EIN, non-logo fields. EIN saves on
  // blur (its own action); logo saves through its own upload flow. Save
  // Changes only writes the address/contact subset.
  const formForDirty = { ...form, tax_id_ein: null, logo_url: null };
  const initialForDirty = { ...initial, tax_id_ein: null, logo_url: null };
  const dirty = JSON.stringify(formForDirty) !== JSON.stringify(initialForDirty);
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
      return { ok: false as const, error: res.error };
    }
    router.refresh();
    return { ok: true as const };
  }

  // Register with the global Settings save bar so users don't have to
  // scroll to find an inline Save Changes button. ready blocks save when
  // org name is empty (required field). Discard reverts the form to the
  // last fetched snapshot.
  useSaveBarSection("settings-company-profile", {
    isDirty: dirty,
    save: async () => {
      if (!ready) {
        return { ok: false, error: "Company Name is required" };
      }
      const r = await onSave();
      return r;
    },
    discard: () => {
      setForm(initial);
      setErrMsg(null);
    },
  });

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
          style={
            initial.logo_url
              ? {
                  backgroundImage: `url(${initial.logo_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: "transparent",
                }
              : { fontSize: 14, letterSpacing: "0.04em" }
          }
        >
          {!initial.logo_url && initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="clean-hero-title">{form.name || "Your Organization"}</div>
          <div className="clean-hero-meta">
            {form.legal_name ?? ""}
            {form.legal_name && form.city ? " · " : ""}
            {form.city && form.region ? `${form.city}, ${form.region}` : form.city ?? ""}
          </div>
        </div>
        <div className="clean-hero-upload flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadErr(null);
              setUploading(true);
              const fd = new FormData();
              fd.append("file", file);
              const res = await uploadOrgLogo(fd);
              setUploading(false);
              if (!res.ok) {
                setUploadErr(res.error);
                return;
              }
              router.refresh();
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading
              ? "Uploading…"
              : initial.logo_url
                ? "Replace Logo"
                : "Upload Logo"}
          </button>
          {initial.logo_url && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={uploading}
              style={{ color: "var(--danger)" }}
              onClick={async () => {
                setUploading(true);
                const res = await removeOrgLogo();
                setUploading(false);
                if (!res.ok) {
                  setUploadErr(res.error);
                  return;
                }
                router.refresh();
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {uploadErr && (
        <div style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}>
          {uploadErr}
        </div>
      )}

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
      <PrefRow title="Tax ID (EIN)" desc="Used on contracts and tax forms. Stored only on this org row, never on a lead.">
        <input
          className="input pref-row-input"
          value={ein}
          onChange={(e) => setEin(e.target.value)}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next === (initial.tax_id_ein ?? "")) return;
            startTransition(async () => {
              await setOrgTaxId(next);
              router.refresh();
            });
          }}
          placeholder="00-0000000"
        />
      </PrefRow>

      {/* Inline Save/Discard removed — commits flow through the global
          bottom-right SettingsSaveBar so the controls are reachable
          without scrolling. errMsg still rendered here for in-context
          feedback when a save fails. */}
      {errMsg && (
        <div className="mt-6 flex items-center gap-3">
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
