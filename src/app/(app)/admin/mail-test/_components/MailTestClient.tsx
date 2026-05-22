"use client";

import { useCallback, useState, useTransition } from "react";
import { IconCheck, IconX, IconPlayerPlay, IconTrash, IconLoader2, IconInfoCircle } from "@tabler/icons-react";
import { SCENARIOS, type Scenario } from "../_scenarios";
import {
  seedMailTestArtifacts,
  runMailTestScenario,
  cleanupMailTestArtifacts,
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

function formatCents(c: number | null): string {
  if (c == null) return "—";
  return `$${(c / 100).toFixed(2)}`;
}

export function MailTestClient() {
  const [seed, setSeed] = useState<SeedState>({ kind: "idle" });
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [, startTransition] = useTransition();
  const [globalErr, setGlobalErr] = useState<string | null>(null);

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
      {/* Bulk recommendation banner */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-charcoal">
        <div className="flex items-start gap-2">
          <IconInfoCircle size={18} className="mt-0.5 text-gray-500" />
          <div>
            <div className="font-medium">Bulk mailers recommendation</div>
            <div className="text-gray-700 mt-1">
              Multi-recipient sends (N=3 per scenario) are covered in this
              harness via the &quot;3 recipients&quot; scenario. True large-batch
              bulk send (50+ recipients with progress / partial-failure UX)
              is not implemented. Recommend deferring it until single + multi
              prove out — adds queue, retry semantics, and progress UI that
              we should not invent before need is concrete.
            </div>
          </div>
        </div>
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
