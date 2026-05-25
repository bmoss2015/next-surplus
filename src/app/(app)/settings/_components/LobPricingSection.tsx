"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateLobPricing } from "@/app/(app)/settings/_actions";
import type { LobPricingSettings } from "@/lib/settings/fetch";

// Admin-editable Lob rate schedule. Lob's API doesn't return per-piece
// cost at send time (their billing reconciles monthly), so this rate
// schedule is the portal's source of truth for spend tracking.
//
// Defaults match Lob Developer-tier published rates. The weekly cron
// fetches Lob's latest published rates into orgs.lob_published_pricing_cents
// so admins can see drift. Toggle auto-sync on if you pay published list
// pricing; leave off if you have a custom contract so the cron only
// alerts on drift instead of overwriting your rates.

type Form = {
  tier_label: string;
  // All values entered as dollars in the UI; converted to cents on save.
  check_base: string;
  check_extra_attachment_page: string;
  letter_first_class_bw: string;
  letter_first_class_color: string;
  letter_standard_bw: string;
  letter_standard_color: string;
  letter_certified_bw: string;
  letter_certified_color: string;
  letter_extra_page_bw: string;
  letter_extra_page_color: string;
  auto_sync: boolean;
};

const NUMERIC_FIELDS = [
  "check_base",
  "check_extra_attachment_page",
  "letter_first_class_bw",
  "letter_first_class_color",
  "letter_standard_bw",
  "letter_standard_color",
  "letter_certified_bw",
  "letter_certified_color",
  "letter_extra_page_bw",
  "letter_extra_page_color",
] as const;

const FIELD_GROUPS: {
  title: string;
  fields: { key: (typeof NUMERIC_FIELDS)[number]; label: string }[];
}[] = [
  {
    title: "Letters",
    fields: [
      { key: "letter_first_class_bw", label: "First Class, B&W" },
      { key: "letter_first_class_color", label: "First Class, Color" },
      { key: "letter_standard_bw", label: "Standard, B&W" },
      { key: "letter_standard_color", label: "Standard, Color" },
      { key: "letter_certified_bw", label: "Certified, B&W" },
      { key: "letter_certified_color", label: "Certified, Color" },
    ],
  },
  {
    title: "Extra Pages",
    fields: [
      { key: "letter_extra_page_bw", label: "Per Extra Page, B&W" },
      { key: "letter_extra_page_color", label: "Per Extra Page, Color" },
    ],
  },
  {
    title: "Checks",
    fields: [
      { key: "check_base", label: "Base Per Check" },
      { key: "check_extra_attachment_page", label: "Per Attachment Page" },
    ],
  },
];

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars: string): number {
  const n = parseFloat(dollars);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function formFromSettings(s: LobPricingSettings): Form {
  return {
    tier_label: s.current.tier_label,
    check_base: centsToDollars(s.current.check_base),
    check_extra_attachment_page: centsToDollars(
      s.current.check_extra_attachment_page
    ),
    letter_first_class_bw: centsToDollars(s.current.letter_first_class_bw),
    letter_first_class_color: centsToDollars(
      s.current.letter_first_class_color
    ),
    letter_standard_bw: centsToDollars(s.current.letter_standard_bw),
    letter_standard_color: centsToDollars(s.current.letter_standard_color),
    letter_certified_bw: centsToDollars(s.current.letter_certified_bw),
    letter_certified_color: centsToDollars(s.current.letter_certified_color),
    letter_extra_page_bw: centsToDollars(s.current.letter_extra_page_bw),
    letter_extra_page_color: centsToDollars(s.current.letter_extra_page_color),
    auto_sync: s.auto_sync,
  };
}

export function LobPricingSection({
  initial,
}: {
  initial: LobPricingSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => formFromSettings(initial));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = useMemo(() => {
    const baseline = formFromSettings(initial);
    return JSON.stringify(baseline) !== JSON.stringify(form);
  }, [form, initial]);

  // Drift indicator per field — true when the user's saved value
  // diverges from Lob's latest published rate. Computed against the
  // current saved values (initial.current), not the in-progress form,
  // so editing one row doesn't flag everything else.
  const driftFor = (key: (typeof NUMERIC_FIELDS)[number]): boolean => {
    if (!initial.published) return false;
    return initial.current[key] !== initial.published[key];
  };

  const driftBadge = (key: (typeof NUMERIC_FIELDS)[number]) => {
    if (!initial.published) return null;
    if (!driftFor(key)) return null;
    return (
      <span
        className="ml-1 inline-flex rounded-full border border-gray-300 px-1.5 text-[9px] font-medium text-ink"
        title={`Lob's published rate is ${centsToDollars(initial.published[key])}.`}
      >
        Drift
      </span>
    );
  };

  async function onSave() {
    setErr(null);
    setSaving(true);
    const payload: Parameters<typeof updateLobPricing>[0] = {
      tier_label: form.tier_label,
      check_base: dollarsToCents(form.check_base),
      check_extra_attachment_page: dollarsToCents(
        form.check_extra_attachment_page
      ),
      letter_first_class_bw: dollarsToCents(form.letter_first_class_bw),
      letter_first_class_color: dollarsToCents(form.letter_first_class_color),
      letter_standard_bw: dollarsToCents(form.letter_standard_bw),
      letter_standard_color: dollarsToCents(form.letter_standard_color),
      letter_certified_bw: dollarsToCents(form.letter_certified_bw),
      letter_certified_color: dollarsToCents(form.letter_certified_color),
      letter_extra_page_bw: dollarsToCents(form.letter_extra_page_bw),
      letter_extra_page_color: dollarsToCents(form.letter_extra_page_color),
      auto_sync: form.auto_sync,
    };
    for (const k of NUMERIC_FIELDS) {
      if (!Number.isFinite(payload[k])) {
        setErr(`Enter a valid dollar amount for every field.`);
        setSaving(false);
        return;
      }
    }
    const res = await updateLobPricing(payload);
    setSaving(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    router.refresh();
  }

  function onReset() {
    setForm(formFromSettings(initial));
    setErr(null);
  }

  function syncFromPublished() {
    if (!initial.published) return;
    const p = initial.published;
    setForm({
      ...form,
      tier_label: p.tier_label,
      check_base: centsToDollars(p.check_base),
      check_extra_attachment_page: centsToDollars(p.check_extra_attachment_page),
      letter_first_class_bw: centsToDollars(p.letter_first_class_bw),
      letter_first_class_color: centsToDollars(p.letter_first_class_color),
      letter_standard_bw: centsToDollars(p.letter_standard_bw),
      letter_standard_color: centsToDollars(p.letter_standard_color),
      letter_certified_bw: centsToDollars(p.letter_certified_bw),
      letter_certified_color: centsToDollars(p.letter_certified_color),
      letter_extra_page_bw: centsToDollars(p.letter_extra_page_bw),
      letter_extra_page_color: centsToDollars(p.letter_extra_page_color),
    });
  }

  const lastChecked = initial.last_checked_at
    ? new Date(initial.last_checked_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section id="panel-mail-pricing" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Mail</a>
        <i className="icon icon-chevron-right" />
        <span>Lob Pricing</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Lob Pricing</h1>
          <p className="section-desc">
            Per-piece rates used to compute spend on every check or letter
            sent through Lob. Defaults match Lob&apos;s published Developer
            tier. Override to reflect your actual contract pricing (volume
            discounts, Startup / Growth tier, or custom enterprise rates).
          </p>
        </div>
      </div>

      <div className="pref-section-h">Tier Label</div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Tier Label</div>
          <div className="pref-row-desc">
            Free-text label so other admins can tell at a glance which Lob
            plan these rates reflect (e.g. &quot;Growth (signed Q1
            2026)&quot;).
          </div>
        </div>
        <input
          className="input pref-row-input"
          value={form.tier_label}
          onChange={(e) => setForm({ ...form, tier_label: e.target.value })}
          placeholder="Developer (published)"
        />
      </div>

      {FIELD_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="pref-section-h">{group.title}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px",
              rowGap: 0,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            {group.fields.map((f) => (
              <div
                key={f.key}
                style={{
                  display: "contents",
                }}
              >
                <div
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--hairline)",
                    fontSize: 13,
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {f.label}
                  {driftBadge(f.key)}
                </div>
                <div
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <span style={{ color: "var(--gray-500)", fontSize: 12 }}>
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    className="input"
                    style={{ width: 100, textAlign: "right" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="pref-section-h">Auto Sync</div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">
            Match Lob&apos;s Published List Weekly
          </div>
          <div className="pref-row-desc">
            When on, the weekly cron overwrites your rates with whatever
            Lob currently lists for the Developer tier. Turn this off if
            you have a custom contract, so the cron only flags drift
            without changing your rates.
            {lastChecked && (
              <>
                {" "}
                Last checked: <strong>{lastChecked}</strong>.
              </>
            )}
          </div>
        </div>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.auto_sync}
            onChange={(e) =>
              setForm({ ...form, auto_sync: e.target.checked })
            }
            style={{ cursor: "pointer" }}
          />
          <span style={{ fontSize: 13, color: "var(--ink)" }}>
            {form.auto_sync ? "Auto sync on" : "Auto sync off"}
          </span>
        </label>
      </div>

      {initial.published && (
        <div className="pref-row">
          <div className="flex-1 min-w-0">
            <div className="pref-row-title">
              Replace With Lob&apos;s Published Rates
            </div>
            <div className="pref-row-desc">
              Loads Lob&apos;s most recent published Developer-tier rates
              into the form. Click Save Changes to apply.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={syncFromPublished}
          >
            Load Published Rates
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saving || !dirty}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={saving || !dirty}
          onClick={onReset}
        >
          Discard
        </button>
        {err && (
          <span style={{ color: "var(--danger)", fontSize: 12.5 }}>{err}</span>
        )}
      </div>
    </section>
  );
}
