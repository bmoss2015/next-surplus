"use client";

// Settings panel that lists every playbook in the org. Edit pencil + Create
// button both navigate to the full-page editor at /settings/playbooks/[id].
// This panel sits in its own SubRail group ("Playbooks") so playbooks aren't
// buried under Templates.

import { useRouter } from "next/navigation";
import { IconChevronRight, IconPencil } from "@tabler/icons-react";
import type { ResearchTemplateRow } from "@/lib/settings/fetch";
import { US_STATES } from "@/components/StatesPicker";

export function PlaybooksSection({
  research,
  canEdit,
}: {
  research: ResearchTemplateRow[];
  canEdit: boolean;
}) {
  const router = useRouter();

  return (
    <section id="panel-playbooks" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <span>Playbooks</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Playbooks</h1>
          <p className="section-desc">
            A Playbook is a reusable checklist that attaches to leads
            automatically or manually. Each step can have sub-steps for
            repeating actions like Call 1, Call 2, Call 3.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => router.push("/settings/playbooks/new")}
          >
            <i className="icon icon-plus" /> Add Playbook
          </button>
        )}
      </div>

      <div className="list">
        {research.length === 0 ? (
          <div className="list-row" style={{ color: "var(--text-3)", fontSize: 13 }}>
            No playbooks yet. Click Add Playbook to create one.
          </div>
        ) : (
          research.map((p) => {
            const totalSteps = p.steps.reduce(
              (acc, s) => acc + Math.max(1, s.children?.length ?? 0),
              0
            );
            const applyLabel = describeApply(p);
            return (
              <div
                key={p.id}
                className="list-row group cursor-pointer"
                onClick={() =>
                  canEdit && router.push(`/settings/playbooks/${p.id}`)
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{p.name}</div>
                  <div
                    className="mt-0.5 text-[12px]"
                    style={{ color: "var(--text-2)" }}
                  >
                    {p.description ? (
                      <>
                        <span>{p.description}</span>
                        <span style={{ color: "var(--text-3, #94a3b8)" }}>
                          {" · "}
                        </span>
                      </>
                    ) : null}
                    <span>
                      {totalSteps} {totalSteps === 1 ? "Step" : "Steps"}
                    </span>
                    <span style={{ color: "var(--text-3, #94a3b8)" }}>
                      {" · "}
                    </span>
                    <span>{applyLabel}</span>
                  </div>
                </div>
                {canEdit && (
                  <div className="ml-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/settings/playbooks/${p.id}`);
                      }}
                      title="Edit playbook"
                      aria-label="Edit playbook"
                    >
                      <IconPencil size={13} stroke={1.75} />
                    </button>
                    <IconChevronRight
                      size={14}
                      stroke={1.75}
                      style={{ color: "var(--text-3, #94a3b8)" }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function describeApply(p: ResearchTemplateRow): string {
  if (p.apply_mode === "manual") return "Manually Added";
  if (p.apply_mode === "all") return "Auto-Applied To All Imported Leads";
  const states = p.apply_states ?? [];
  if (states.length === 0) {
    return p.state ? `Auto-Applied In ${p.state}` : "Auto-Applied (No States)";
  }
  if (states.length === US_STATES.length) {
    return "Auto-Applied To All Imported Leads";
  }
  if (states.length <= 4) {
    return `Auto-Applied In ${states.join(", ")}`;
  }
  return `Auto-Applied In ${states.length} States`;
}
