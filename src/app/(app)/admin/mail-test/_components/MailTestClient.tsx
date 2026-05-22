"use client";

import { useCallback, useState, useTransition } from "react";
import { IconCheck, IconX, IconPlayerPlay, IconTrash, IconLoader2, IconDatabase } from "@tabler/icons-react";
import Link from "next/link";
import { SCENARIOS, type Scenario } from "../_scenarios";
import {
  seedMailTestArtifacts,
  runMailTestScenario,
  cleanupMailTestArtifacts,
  seedSampleMailData,
  deleteStaleFailedMailJobs,
  type RunResult,
} from "../actions";

type SeedState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; template_id: string; bank_account_id: string; bank_provider: string; notes: string[] }
  | { kind: "error"; error: string };

type RowState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: RunResult }
  | { kind: "error"; error: string };

type SampleStage = {
  lead_id: string;
  label: string;
  stage_name: string;
  piece_count: number;
};

type SampleState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "done";
      inserted: number;
      lead_id: string | null;
      stages: SampleStage[];
    }
  | { kind: "error"; error: string };

type SweepState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; deleted: number }
  | { kind: "error"; error: string };

function formatCents(c: number | null): string {
  if (c == null) return "—";
  return `$${(c / 100).toFixed(2)}`;
}

export function MailTestClient() {
  const [seed, setSeed] = useState<SeedState>({ kind: "idle" });
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [, startTransition] = useTransition();
  const [globalErr, setGlobalErr] = useState<string | null>(null);
  const [sample, setSample] = useState<SampleState>({ kind: "idle" });
  const [sweep, setSweep] = useState<SweepState>({ kind: "idle" });

  const handleSweepFailed = useCallback(() => {
    setSweep({ kind: "loading" });
    startTransition(async () => {
      const res = await deleteStaleFailedMailJobs();
      if (!res.ok) {
        setSweep({ kind: "error", error: res.error });
        return;
      }
      setSweep({ kind: "done", deleted: res.deleted });
    });
  }, []);

  const handleSeedSamples = useCallback(() => {
    setSample({ kind: "loading" });
    startTransition(async () => {
      const res = await seedSampleMailData();
      if (!res.ok) {
        setSample({ kind: "error", error: res.error });
        return;
      }
      setSample({
        kind: "done",
        inserted: res.inserted,
        lead_id: res.lead_id,
        stages: res.stages,
      });
    });
  }, []);

  const ensureSeeded = useCallback(async (): Promise<SeedState | null> => {
    if (seed.kind === "ready") return seed;
    setSeed({ kind: "loading" });
    const res = await seedMailTestArtifacts();
    if (!res.ok) {
      setSeed({ kind: "error", error: res.error });
      return null;
    }
    const next: SeedState = {
      kind: "ready",
      template_id: res.template_id,
      bank_account_id: res.bank_account_id,
      bank_provider: res.bank_provider,
      notes: res.notes,
    };
    setSeed(next);
    return next;
  }, [seed]);

  const runOne = useCallback(
    async (scenario: Scenario) => {
      const ready = await ensureSeeded();
      if (!ready || ready.kind !== "ready") return;
      setRows((r) => ({ ...r, [scenario.id]: { kind: "running" } }));
      try {
        const result = await runMailTestScenario({
          scenarioId: scenario.id,
          template_id: ready.template_id,
          bank_account_id: ready.bank_account_id,
        });
        setRows((r) => ({ ...r, [scenario.id]: { kind: "done", result } }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setRows((r) => ({ ...r, [scenario.id]: { kind: "error", error: msg } }));
      }
    },
    [ensureSeeded]
  );

  const runAll = useCallback(async () => {
    setGlobalErr(null);
    const ready = await ensureSeeded();
    if (!ready || ready.kind !== "ready") return;
    for (const s of SCENARIOS) {
      setRows((r) => ({ ...r, [s.id]: { kind: "running" } }));
      try {
        const result = await runMailTestScenario({
          scenarioId: s.id,
          template_id: ready.template_id,
          bank_account_id: ready.bank_account_id,
        });
        setRows((r) => ({ ...r, [s.id]: { kind: "done", result } }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setRows((r) => ({ ...r, [s.id]: { kind: "error", error: msg } }));
      }
    }
  }, [ensureSeeded]);

  const cleanup = useCallback(() => {
    setGlobalErr(null);
    startTransition(async () => {
      const res = await cleanupMailTestArtifacts();
      if (!res.ok) {
        setGlobalErr(res.error);
        return;
      }
      setSeed({ kind: "idle" });
      setRows({});
    });
  }, []);

  const totalRun = Object.values(rows).filter((r) => r.kind === "done").length;
  const totalMatched = Object.values(rows).filter(
    (r) => r.kind === "done" && r.result.matched
  ).length;

  return (
    <div className="space-y-6">
      {/* Quick sample data — for evaluating the new UI on a populated list */}
      <div className="rounded-md border border-petrol-200 bg-petrol-50/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] font-medium text-petrol-800">
              Sample Mail Data
            </div>
            <div className="mt-1 text-[12px] text-petrol-900/80">
              Inserts 7 realistic mail_jobs rows directly into the DB (no
              provider calls, no cost). Distributed across your 4 most
              recent leads so each lead demonstrates a distinct stage —
              just sent, delivered, needs attention, active campaign.
            </div>
            {sample.kind === "done" && (
              <div className="mt-3 space-y-2">
                <div className="text-[12px] text-petrol-900">
                  Inserted {sample.inserted} sample rows.{" "}
                  <Link
                    href="/mail"
                    className="cursor-pointer font-medium underline"
                  >
                    Open /mail dashboard
                  </Link>
                </div>
                <div className="rounded-md border border-petrol-200 bg-white p-3">
                  <div className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
                    Lead Samples By Stage
                  </div>
                  <ul className="space-y-1.5">
                    {sample.stages.map((s) => (
                      <li
                        key={s.lead_id}
                        className="flex items-baseline justify-between gap-3 text-[12px]"
                      >
                        <Link
                          href={`/leads/${s.lead_id}?tab=mail`}
                          className="cursor-pointer font-medium text-petrol-700 underline hover:text-petrol-900"
                        >
                          {s.label}
                        </Link>
                        <span className="text-gray-600">
                          {s.stage_name}{" "}
                          <span className="text-gray-400">
                            ({s.piece_count} {s.piece_count === 1 ? "piece" : "pieces"})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {sample.kind === "error" && (
              <div className="mt-2 text-[12px] text-danger">{sample.error}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSeedSamples}
            disabled={sample.kind === "loading"}
            className="btn-primary disabled:opacity-50 cursor-pointer inline-flex shrink-0 items-center gap-1.5"
          >
            <IconDatabase size={14} stroke={1.75} />
            {sample.kind === "loading" ? "Seeding..." : "Seed Sample Mail Data"}
          </button>
        </div>
      </div>

      {/* Sweep legacy failed rows — for cleaning up Susan Martinez and
          any other pre-Fix-66 failed records that shouldn't exist after
          the no-persist-on-sync-failure change. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white p-4">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink">
            Sweep Legacy Failed Records
          </div>
          <div className="mt-1 text-[12px] text-gray-600">
            Deletes every <code>mail_jobs</code> row currently marked
            failed. After Fix 66, sync provider rejections no longer
            persist as failed rows — this is a one-time cleanup for the
            legacy ones (Susan Martinez, etc.). Activity entries on the
            related leads are kept.
          </div>
          {sweep.kind === "done" && (
            <div className="mt-2 text-[12px] text-petrol-700">
              Deleted {sweep.deleted} failed record{sweep.deleted === 1 ? "" : "s"}.
            </div>
          )}
          {sweep.kind === "error" && (
            <div className="mt-2 text-[12px] text-danger">{sweep.error}</div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSweepFailed}
          disabled={sweep.kind === "loading"}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <IconTrash size={14} stroke={1.75} />
          {sweep.kind === "loading" ? "Deleting..." : "Delete Failed Records"}
        </button>
      </div>

      {/* Seed status + actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-4">
        <button
          type="button"
          onClick={() => void ensureSeeded()}
          disabled={seed.kind === "loading" || seed.kind === "ready"}
          className="btn-primary disabled:opacity-50 cursor-pointer"
        >
          {seed.kind === "loading" ? "Seeding..." : seed.kind === "ready" ? "Seeded" : "Seed Test Artifacts"}
        </button>
        <button
          type="button"
          onClick={() => void runAll()}
          disabled={seed.kind === "loading"}
          className="rounded-md border border-charcoal bg-white px-4 py-2 text-sm font-medium text-charcoal hover:bg-gray-50 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
        >
          <IconPlayerPlay size={16} /> Run All Scenarios
        </button>
        <button
          type="button"
          onClick={cleanup}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer inline-flex items-center gap-2"
        >
          <IconTrash size={16} /> Cleanup Harness Data
        </button>
        <div className="text-sm text-gray-600 ml-auto">
          {totalRun > 0 && (
            <span>
              {totalMatched} of {totalRun} matched expectation
            </span>
          )}
        </div>
      </div>

      {seed.kind === "ready" && (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-xs text-gray-700">
          <div className="font-medium text-charcoal mb-1">Seed Details</div>
          <div>Template: <code>{seed.template_id}</code></div>
          <div>Bank account: <code>{seed.bank_account_id}</code> <span className="text-gray-500">({seed.bank_provider})</span></div>
          {seed.notes.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-gray-600">
              {seed.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
      {seed.kind === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Seed failed: {seed.error}
        </div>
      )}
      {globalErr && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {globalErr}
        </div>
      )}

      {/* Scenario grid */}
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2">Scenario</th>
              <th className="px-3 py-2">Expect</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Jobs</th>
              <th className="px-3 py-2">Activities</th>
              <th className="px-3 py-2">Notifications</th>
              <th className="px-3 py-2">Details</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {SCENARIOS.map((s) => {
              const state = rows[s.id] ?? { kind: "idle" };
              return (
                <ScenarioRow
                  key={s.id}
                  scenario={s}
                  state={state}
                  onRun={() => void runOne(s)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioRow({
  scenario,
  state,
  onRun,
}: {
  scenario: Scenario;
  state: RowState;
  onRun: () => void;
}) {
  const result = state.kind === "done" ? state.result : null;
  const matched = result?.matched ?? null;
  const provider =
    result?.send.ok && result.send.provider_letter
      ? scenario.check.include
        ? `check via ${result.send.provider_check}`
        : `letter via ${result.send.provider_letter}`
      : null;
  const totalCost = (result?.jobs ?? []).reduce(
    (sum, j) => sum + (j.cost_cents ?? 0),
    0
  );

  return (
    <tr className={state.kind === "running" ? "bg-brand-soft/30" : ""}>
      <td className="px-3 py-2 align-top">
        {state.kind === "running" && (
          <IconLoader2 size={16} className="animate-spin text-gray-500" />
        )}
        {state.kind === "done" && matched === true && (
          <IconCheck size={18} className="text-petrol" />
        )}
        {state.kind === "done" && matched === false && (
          <IconX size={18} className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <div className="font-medium text-charcoal">{scenario.label}</div>
        <div className="text-xs text-gray-500">{scenario.id}</div>
      </td>
      <td className="px-3 py-2 align-top text-xs">
        <span className={scenario.expect === "pass" ? "text-petrol" : "text-charcoal"}>
          {scenario.expect}
        </span>
        {scenario.expectedErrorContains && (
          <div className="text-gray-500 mt-1">
            matches: <code>{scenario.expectedErrorContains}</code>
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs text-gray-700">
        {provider ?? "—"}
        {result?.jobs[0] && (
          <div className="text-gray-500 mt-1">
            {result.jobs[0].cost_source}
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs">
        {result ? (
          <div>
            <div className="font-medium text-charcoal">{formatCents(totalCost)}</div>
            {result.jobs.length > 1 && (
              <div className="text-gray-500">
                {formatCents(result.jobs[0]?.cost_cents ?? null)} × {result.jobs.length}
              </div>
            )}
          </div>
        ) : "—"}
      </td>
      <td className="px-3 py-2 align-top text-xs text-gray-700">
        {result?.jobs.length ?? "—"}
        {result && result.jobs.length > 0 && (
          <div className="text-gray-500 truncate max-w-[8rem]" title={result.jobs.map(j => j.id).join(", ")}>
            {result.jobs[0]?.id.slice(0, 8)}…
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs text-gray-700">
        {result?.activities.length ?? "—"}
      </td>
      <td className="px-3 py-2 align-top text-xs text-gray-700">
        {result?.notifications.length ?? "—"}
        {result?.notifications[0] && (
          <div className="text-gray-500 truncate max-w-[10rem]" title={result.notifications[0].type}>
            {result.notifications[0].type}
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs">
        {state.kind === "done" && state.result.send.ok === false && (
          <div className="text-red-700 max-w-xs whitespace-pre-wrap">
            {state.result.send.error}
          </div>
        )}
        {state.kind === "done" && state.result.send.ok === true && state.result.jobs[0]?.status && (
          <div className="text-charcoal">
            status: <span className="font-medium">{state.result.jobs[0].status}</span>
          </div>
        )}
        {state.kind === "done" && state.result.notes.length > 0 && (
          <ul className="text-gray-500 mt-1 list-disc pl-4">
            {state.result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}
        {state.kind === "error" && (
          <div className="text-red-700">{state.error}</div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-right">
        <button
          type="button"
          onClick={onRun}
          disabled={state.kind === "running"}
          className="rounded-md border border-charcoal bg-white px-3 py-1 text-xs font-medium text-charcoal hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          {state.kind === "running" ? "Running..." : state.kind === "done" ? "Re-run" : "Run"}
        </button>
      </td>
    </tr>
  );
}
