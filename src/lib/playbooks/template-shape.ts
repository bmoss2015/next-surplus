// Canonical interpretation of a research_templates.steps JSONB value.
//
// A template's `steps` is a nested array: each top-level entry is a STAGE and
// may carry a `children` array of sub-steps. When a playbook is added to a
// lead, freshStepsFromTemplate() FLATTENS it into the per-lead checklist:
//   - a stage with N children  -> N leaf rows (the checkboxes), one per child
//   - a stage with no children -> 1 leaf row (the stage is its own checkbox)
// The lead's checklist (lead_research_templates.steps) is exactly this flat
// list, and the Settings editor's "total steps" counter uses the same rule
// (Math.max(1, children.length)). The helpers below are the single source of
// truth for that mapping so the Add Playbook picker, the Playbooks index, and
// the per-playbook board all agree on what counts as a "step" and which stage a
// lead currently sits in.

export type TemplateStage = {
  name: string;
  // Half-open range [start, end) of flattened leaf (checkbox) indices that
  // belong to this stage.
  start: number;
  end: number;
  leafCount: number;
};

// Break a template's nested steps into stages with their flattened leaf ranges.
// Backward compatible with old flat templates (no `children`): each entry
// becomes a single-leaf stage, so leaf count == entry count as before.
export function templateStages(raw: unknown): TemplateStage[] {
  if (!Array.isArray(raw)) return [];
  const stages: TemplateStage[] = [];
  let cursor = 0;
  for (const entry of raw as Array<Record<string, unknown>>) {
    const name = String(entry?.name ?? "");
    const children = Array.isArray(entry?.children) ? entry.children : [];
    const leafCount = children.length === 0 ? 1 : children.length;
    stages.push({ name, start: cursor, end: cursor + leafCount, leafCount });
    cursor += leafCount;
  }
  return stages;
}

// Number of checkboxes a lead gets from this template — the count shown next to
// a playbook in the picker and on the Playbooks index. A stage with sub-steps
// contributes one per sub-step; a stage with none contributes one.
export function countTemplateLeafSteps(raw: unknown): number {
  const stages = templateStages(raw);
  return stages.length === 0 ? 0 : stages[stages.length - 1].end;
}

// Map a flattened leaf index (e.g. the lead's first incomplete checkbox) to the
// stage that owns it. Returns stages.length when the index is past the last
// leaf, i.e. the lead has completed every checkbox.
export function stageIndexForLeaf(
  stages: TemplateStage[],
  leafIndex: number
): number {
  for (let i = 0; i < stages.length; i++) {
    if (leafIndex < stages[i].end) return i;
  }
  return stages.length;
}
