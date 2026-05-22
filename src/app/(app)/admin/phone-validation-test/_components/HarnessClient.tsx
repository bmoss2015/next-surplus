"use client";

import { useState, useTransition } from "react";
import {
  testValidatePhone,
  refreshBalance,
  testPreviewBackfill,
  type TestRunResult,
  type PreviewBackfillResult,
} from "../_actions";
import type { ValidationUsageSummary } from "@/lib/phone-validate";

type RunLog =
  | (Extract<TestRunResult, { ok: true }> & { runId: number; label: string })
  | { ok: false; error: string; runId: number; label: string; phone: string };

export function HarnessClient({
  initialUsage,
  costPerCreditUsd,
}: {
  initialUsage: ValidationUsageSummary;
  costPerCreditUsd: number;
}) {
  const [usage, setUsage] = useState<ValidationUsageSummary>(initialUsage);
  const [phone, setPhone] = useState("");
  const [secondPhone, setSecondPhone] = useState("");
  const [log, setLog] = useState<RunLog[]>([]);
  const [preview, setPreview] = useState<PreviewBackfillResult | null>(null);
  const [pending, startTransition] = useTransition();
  const runIdRef = useState(() => ({ n: 0 }))[0];

  function appendLog(entry: { label: string } & (Omit<Extract<RunLog, { ok: true }>, "runId" | "label"> | Omit<Extract<RunLog, { ok: false }>, "runId" | "label">)) {
    runIdRef.n += 1;
    setLog((prev) => [{ ...entry, runId: runIdRef.n } as RunLog, ...prev]);
  }

  function runOnce(label: string, p: string) {
    if (!p.trim()) return;
    startTransition(async () => {
      const res = await testValidatePhone(p);
      if (res.ok) {
        appendLog({ ...res, label });
        // Refresh the top-of-page usage display so the meter reflects the
        // post-call balance immediately.
        const rb = await refreshBalance();
        if (rb.ok) setUsage(rb.usage);
      } else {
        appendLog({ ok: false, error: res.error, label, phone: p.trim() });
      }
    });
  }

  function runDoubleHit() {
    if (!phone.trim()) return;
    startTransition(async () => {
      const first = await testValidatePhone(phone);
      if (first.ok) appendLog({ ...first, label: "Round 1 (expect fresh / clearout)" });
      else appendLog({ ok: false, error: first.error, label: "Round 1", phone: phone.trim() });

      const second = await testValidatePhone(phone);
      if (second.ok) appendLog({ ...second, label: "Round 2 (expect cache / clearout-cache)" });
      else appendLog({ ok: false, error: second.error, label: "Round 2", phone: phone.trim() });

      const rb = await refreshBalance();
      if (rb.ok) setUsage(rb.usage);
    });
  }

  function onRefresh() {
    startTransition(async () => {
      const rb = await refreshBalance();
      if (rb.ok) setUsage(rb.usage);
    });
  }

  function onPreviewBackfill() {
    startTransition(async () => {
      const res = await testPreviewBackfill();
      setPreview(res);
    });
  }

  const usd = (n: number | null | undefined) =>
    n == null
      ? "—"
      : n.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        });

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Phone Validation Test Harness</h1>
          <p style={styles.subtitle}>
            Admin-only. Exercises every validator path from a single screen so
            behavior can be confirmed without clicking through real lead cards.
            Live balance is pulled fresh from the provider before and after each
            call so credit consumption is visible.
          </p>
        </div>
      </header>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>Live Balance</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={pending}
            style={styles.btnGhost}
          >
            {pending ? "…" : "Refresh"}
          </button>
        </div>
        <div style={styles.statRow}>
          <Stat
            label="Credits Remaining"
            value={
              usage.remainingCredits != null
                ? usage.remainingCredits.toLocaleString()
                : "—"
            }
            hint={usage.source === "provider_live" ? "Live" : "Fallback"}
          />
          <Stat
            label="Used This Month"
            value={usage.usedThisMonth.toLocaleString()}
          />
          <Stat
            label="Used All-Time"
            value={usage.usedAllTime.toLocaleString()}
          />
          <Stat
            label="Cost / Credit"
            value={usd(costPerCreditUsd)}
            hint="pay-as-you-go"
          />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Single Validation</h2>
        <p style={styles.help}>
          Validates a phone exactly once. Returns provider <code>clearout</code>{" "}
          on a fresh call, <code>clearout-cache</code> when the 90-day cache
          serves the result, or <code>libphonenumber</code> when the format is
          rejected before any provider call.
        </p>
        <div style={styles.formRow}>
          <input
            type="tel"
            placeholder="(803) 206-0345"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => runOnce("Single validate", phone)}
            disabled={pending || !phone.trim()}
            style={styles.btnPrimary}
          >
            Validate Once
          </button>
          <button
            type="button"
            onClick={runDoubleHit}
            disabled={pending || !phone.trim()}
            style={styles.btnPrimary}
          >
            Validate Twice (Cache Test)
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Pre-Filter Test</h2>
        <p style={styles.help}>
          Sends an obviously bad number. Should return{" "}
          <code>provider: libphonenumber</code> and consume 0 credits.
        </p>
        <div style={styles.formRow}>
          <input
            type="tel"
            placeholder="123"
            value={secondPhone}
            onChange={(e) => setSecondPhone(e.target.value)}
            style={styles.input}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => runOnce("Pre-filter", secondPhone)}
            disabled={pending || !secondPhone.trim()}
            style={styles.btnPrimary}
          >
            Send to Validator
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Backfill Preview</h2>
        <p style={styles.help}>
          Counts untested phones on non-lost leads and shows the estimated cost
          without consuming any credits.
        </p>
        <div style={styles.formRow}>
          <button
            type="button"
            onClick={onPreviewBackfill}
            disabled={pending}
            style={styles.btnPrimary}
          >
            Count Untested Phones
          </button>
        </div>
        {preview && preview.ok && (
          <div style={styles.previewBox}>
            <div>
              <strong>{preview.uniquePhones.toLocaleString()}</strong> unique
              phones across <strong>{preview.totalRows.toLocaleString()}</strong>{" "}
              rows.
            </div>
            <div>
              Estimated cost:{" "}
              <strong>
                {preview.estimatedCostUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </strong>{" "}
              (at {usd(preview.costPerCreditUsd)} per credit)
            </div>
          </div>
        )}
        {preview && !preview.ok && (
          <div style={{ ...styles.previewBox, color: "#b22020" }}>
            {preview.error}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Run Log</h2>
        {log.length === 0 ? (
          <p style={styles.help}>
            No runs yet. Click a button above and results appear here, newest
            first.
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Label</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Provider</th>
                <th style={styles.th}>Line Type</th>
                <th style={styles.th}>Credits Before</th>
                <th style={styles.th}>Credits After</th>
                <th style={styles.th}>Delta</th>
                <th style={styles.th}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {log.map((row) => (
                <tr key={row.runId}>
                  <td style={styles.td}>{row.label}</td>
                  <td style={styles.td}>{row.phone}</td>
                  {row.ok ? (
                    <>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            background: badgeBg(row.result.status),
                            color: "#fff",
                          }}
                        >
                          {row.result.status}
                        </span>
                      </td>
                      <td style={styles.tdMono}>{row.result.provider ?? "—"}</td>
                      <td style={styles.td}>{row.result.phoneType ?? "—"}</td>
                      <td style={styles.tdNum}>
                        {row.balanceBefore?.toLocaleString() ?? "—"}
                      </td>
                      <td style={styles.tdNum}>
                        {row.balanceAfter?.toLocaleString() ?? "—"}
                      </td>
                      <td
                        style={{
                          ...styles.tdNum,
                          fontWeight: 600,
                          color:
                            row.creditDelta === 0
                              ? "#0d4b3a"
                              : row.creditDelta && row.creditDelta > 0
                              ? "#b22020"
                              : "#0f1729",
                        }}
                      >
                        {row.creditDelta != null
                          ? row.creditDelta > 0
                            ? `-${row.creditDelta}`
                            : row.creditDelta
                          : "—"}
                      </td>
                      <td style={styles.tdNum}>{row.timestampMs}ms</td>
                    </>
                  ) : (
                    <>
                      <td style={styles.td} colSpan={7}>
                        <span style={{ color: "#b22020" }}>Error: {row.error}</span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>
        {label}
        {hint ? <span style={styles.statHint}> · {hint}</span> : null}
      </div>
    </div>
  );
}

function badgeBg(status: string) {
  if (status === "valid") return "#0d4b3a";
  if (status === "invalid") return "#b22020";
  return "#6b7280";
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    padding: "32px 36px",
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#0f1729",
  },
  header: { marginBottom: 28 },
  h1: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: 13.5,
    lineHeight: 1.55,
    maxWidth: 760,
  },
  section: {
    marginBottom: 24,
    padding: "20px 22px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  h2: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  help: {
    margin: "0 0 14px",
    color: "#475569",
    fontSize: 12.5,
    lineHeight: 1.55,
  },
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  input: {
    flex: "1 1 240px",
    padding: "8px 12px",
    fontSize: 13.5,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
    color: "#fff",
    cursor: "pointer",
  },
  btnGhost: {
    padding: "6px 12px",
    fontSize: 12.5,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  stat: {
    padding: "14px 16px",
    background: "#fafbfc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
    letterSpacing: "0.02em",
  },
  statHint: { color: "#0d4b3a" },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 12.5,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 10px",
    background: "#fafbfc",
    color: "#475569",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid #e5e7eb",
  },
  td: { padding: "8px 10px", borderBottom: "1px solid #f1f3f6" },
  tdMono: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f3f6",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11.5,
  },
  tdNum: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f3f6",
    fontVariantNumeric: "tabular-nums",
    textAlign: "right" as const,
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
  },
  previewBox: {
    marginTop: 12,
    padding: "12px 14px",
    background: "#fafbfc",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.6,
  },
};
