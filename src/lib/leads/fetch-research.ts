import "server-only";
import { createClient } from "@/lib/supabase/server";
import { countTemplateLeafSteps } from "@/lib/playbooks/template-shape";

// Fix JJJJ: a lead carries its own copy of one or more research checklists.
// Each step is { name, url, instructions, done, findings } in display order.
// Editing a Settings template never touches checklists already on a lead.

export type LeadResearchStep = {
  name: string;
  url: string | null;
  instructions: string | null;
  done: boolean;
  findings: string | null;
};

export type LeadResearchTemplate = {
  id: string; // lead_research_templates.id
  sourceTemplateId: string | null;
  name: string;
  collapsed: boolean;
  steps: LeadResearchStep[];
};

export type AvailableTemplate = {
  id: string;
  name: string;
  state: string | null;
  saleType: string | null;
  stepCount: number;
  // True when this Settings template has already been added to the lead.
  alreadyAdded: boolean;
};

export type ResearchData = {
  templates: LeadResearchTemplate[];
  availableTemplates: AvailableTemplate[];
  overallFindings: string | null;
};

type RawTemplateRow = {
  id: string;
  name: string;
  state: string | null;
  sale_type: string | null;
  apply_mode: "manual" | "all" | "match" | null;
  apply_states: string[] | null;
  steps: unknown;
  created_at: string;
};

function normalizeSteps(steps: unknown): LeadResearchStep[] {
  if (!Array.isArray(steps)) return [];
  return (steps as Array<Record<string, unknown>>).map((s) => ({
    name: String(s.name ?? ""),
    url: (s.url as string | null) ?? null,
    instructions: (s.instructions as string | null) ?? null,
    done: s.done === true,
    findings: (s.findings as string | null) ?? null,
  }));
}

function freshStepsFromTemplate(steps: unknown): LeadResearchStep[] {
  if (!Array.isArray(steps)) return [];
  const out: LeadResearchStep[] = [];
  for (const raw of steps as Array<Record<string, unknown>>) {
    const parentName = String(raw.name ?? "");
    const children = Array.isArray(raw.children) ? raw.children : [];
    if (children.length === 0) {
      out.push({
        name: parentName,
        url: (raw.url as string | null) ?? null,
        instructions: (raw.instructions as string | null) ?? null,
        done: false,
        findings: null,
      });
      continue;
    }
    // Flatten: parent + N children become N rows named "Parent · Child" so the
    // existing flat per-lead checklist surfaces every sub-step. The fancy
    // monochrome timeline view ships in a follow-up; this keeps reps unblocked
    // on nested playbooks today.
    for (const childRaw of children as Array<Record<string, unknown>>) {
      const childName = String(childRaw.name ?? "");
      const compositeName = childName
        ? parentName
          ? `${parentName} · ${childName}`
          : childName
        : parentName;
      out.push({
        name: compositeName,
        url: (childRaw.url as string | null) ?? null,
        instructions:
          (childRaw.instructions as string | null) ??
          (raw.instructions as string | null) ??
          null,
        done: false,
        findings: null,
      });
    }
  }
  return out;
}

export async function fetchResearch(
  leadId: string,
  state: string | null,
  saleType: string | null
): Promise<ResearchData> {
  const sb = await createClient();

  const { data: leadRow } = await sb
    .from("leads")
    .select("research_overall_findings, research_initialized")
    .eq("id", leadId)
    .maybeSingle();
  const overallFindings =
    (leadRow?.research_overall_findings as string | null) ?? null;
  const initialized = leadRow?.research_initialized === true;

  // All org templates — used both for the "Add From Template" picker and for
  // the one-time snapshot when the Research tab is first opened.
  const { data: allTemplatesRaw } = await sb
    .from("research_templates")
    .select("id, name, state, sale_type, apply_mode, apply_states, steps, created_at")
    .order("created_at", { ascending: true });
  const allTemplates = (allTemplatesRaw ?? []) as RawTemplateRow[];

  // First open for this lead: snapshot every template that the new apply rules
  // attach to this lead. apply_mode='manual' never auto-attaches; 'all' always
  // attaches; 'match' attaches when the lead's state is in apply_states. For
  // templates predating migration 0138 the apply_mode column was backfilled
  // from the legacy single-state column, so existing single-state and
  // all-states templates behave the same as before.
  if (!initialized) {
    const matching = allTemplates.filter((t) => {
      const mode = t.apply_mode ?? "match";
      if (mode === "manual") return false;
      if (mode === "all") return true;
      const states = Array.isArray(t.apply_states) ? t.apply_states : [];
      if (states.length > 0) return state ? states.includes(state) : false;
      // Fall back to legacy single-state column when apply_states is empty.
      return t.state == null || t.state === state;
    });
    void saleType;
    if (matching.length > 0) {
      await sb.from("lead_research_templates").insert(
        matching.map((t, idx) => ({
          lead_id: leadId,
          source_template_id: t.id,
          name: t.name,
          position: idx,
          steps: freshStepsFromTemplate(t.steps),
        }))
      );
    }
    await sb
      .from("leads")
      .update({ research_initialized: true })
      .eq("id", leadId);
  }

  const { data: lrtRows } = await sb
    .from("lead_research_templates")
    .select("id, source_template_id, name, collapsed, steps, position, created_at")
    .eq("lead_id", leadId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const templates: LeadResearchTemplate[] = (
    (lrtRows ?? []) as Array<{
      id: string;
      source_template_id: string | null;
      name: string;
      collapsed: boolean | null;
      steps: unknown;
    }>
  ).map((r) => ({
    id: r.id,
    sourceTemplateId: r.source_template_id,
    name: r.name,
    collapsed: r.collapsed === true,
    steps: normalizeSteps(r.steps),
  }));

  const addedSourceIds = new Set(
    templates.map((t) => t.sourceTemplateId).filter((x): x is string => !!x)
  );
  const availableTemplates: AvailableTemplate[] = allTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    state: t.state,
    saleType: t.sale_type,
    // Count every checkbox the lead will get (sub-steps included), not the
    // number of top-level stages — matches the lead's flattened checklist.
    stepCount: countTemplateLeafSteps(t.steps),
    alreadyAdded: addedSourceIds.has(t.id),
  }));

  return { templates, availableTemplates, overallFindings };
}
