"use client";

import { useState, useTransition } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import {
  setResearchStepStatus,
  saveResearchStepFindings,
  saveOverallFindings,
} from "../_actions";
import type {
  ResearchTemplate,
  ResearchStepProgress,
} from "@/lib/leads/fetch-research";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Done", "Blocked"] as const;

export function ResearchTabClient({
  leadId,
  template,
  progressByIndex,
  overallFindings,
}: {
  leadId: string;
  template: ResearchTemplate | null;
  progressByIndex: Record<number, ResearchStepProgress>;
  overallFindings: string | null;
}) {
  const [, startTransition] = useTransition();
  const [progress, setProgress] = useState<Record<number, ResearchStepProgress>>(
    progressByIndex
  );
  const [overall, setOverall] = useState(overallFindings ?? "");
  const [savedOverall, setSavedOverall] = useState(overallFindings ?? "");

  function stepState(i: number): ResearchStepProgress {
    return progress[i] ?? { status: "Not Started", findings: null };
  }

  function changeStatus(i: number, status: string, stepName: string) {
    setProgress((prev) => ({
      ...prev,
      [i]: { ...stepState(i), status },
    }));
    startTransition(async () => {
      await setResearchStepStatus(leadId, template!.id, i, status, stepName);
    });
  }

  function changeFindings(i: number, findings: string) {
    setProgress((prev) => ({
      ...prev,
      [i]: { ...stepState(i), findings },
    }));
  }

  function commitFindings(i: number, stepName: string) {
    const findings = stepState(i).findings ?? "";
    startTransition(async () => {
      await saveResearchStepFindings(leadId, template!.id, i, findings, stepName);
    });
  }

  function commitOverall() {
    if (overall === savedOverall) return;
    setSavedOverall(overall);
    startTransition(async () => {
      await saveOverallFindings(leadId, overall);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h3 className="m-0 mb-4 text-[14px] font-medium tracking-tight text-ink">
        Research
      </h3>

      {template ? (
        <div className="space-y-4">
          <div className="text-[12px] text-gray-500">
            Template: <span className="text-ink">{template.name}</span>
          </div>
          <div className="space-y-3">
            {template.steps.map((step, i) => {
              const st = stepState(i);
              return (
                <div
                  key={i}
                  className="rounded-md border border-gray-200 bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink">
                        {step.name}
                      </div>
                      {step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-[2px] inline-flex cursor-pointer items-center gap-1 text-[12px] text-petrol-500 underline hover:text-petrol-700"
                        >
                          {step.url}
                          <IconExternalLink size={12} stroke={1.75} />
                        </a>
                      )}
                      {step.instructions && (
                        <div className="mt-1 text-[11.5px] text-gray-500">
                          {step.instructions}
                        </div>
                      )}
                    </div>
                    <select
                      value={st.status}
                      onChange={(e) => changeStatus(i, e.target.value, step.name)}
                      className="shrink-0 cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] text-ink outline-none focus:border-petrol-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={st.findings ?? ""}
                    onChange={(e) => changeFindings(i, e.target.value)}
                    onBlur={() => commitFindings(i, step.name)}
                    rows={2}
                    placeholder="Findings For This Step"
                    className="mt-2 w-full resize-y rounded-md border border-gray-200 bg-surface px-2.5 py-[7px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-[12.5px] text-gray-500">
          No research template found for this lead type. You can create one in
          Settings under Research Templates, or add findings below.
        </div>
      )}

      <div className="mt-5">
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Overall Findings
        </label>
        <textarea
          value={overall}
          onChange={(e) => setOverall(e.target.value)}
          onBlur={commitOverall}
          rows={4}
          placeholder="Summarize your research findings here."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
      </div>
    </div>
  );
}
