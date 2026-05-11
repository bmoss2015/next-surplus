import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ResearchStep = {
  name: string;
  url?: string | null;
  instructions?: string | null;
};

export type ResearchTemplate = {
  id: string;
  name: string;
  state: string | null;
  sale_type: string | null;
  steps: ResearchStep[];
};

export type ResearchStepProgress = {
  status: string;
  findings: string | null;
};

export type ResearchData = {
  template: ResearchTemplate | null;
  progressByIndex: Record<number, ResearchStepProgress>;
  overallFindings: string | null;
};

export async function fetchResearch(
  leadId: string,
  state: string | null,
  saleType: string | null
): Promise<ResearchData> {
  const sb = await createClient();

  const { data: leadRow } = await sb
    .from("leads")
    .select("research_overall_findings")
    .eq("id", leadId)
    .maybeSingle();
  const overallFindings =
    (leadRow?.research_overall_findings as string | null) ?? null;

  // RLS already scopes to the org; pull candidates that match this lead's
  // state/sale_type (or are universal) and prefer the most specific.
  const { data: templates } = await sb
    .from("research_templates")
    .select("id, name, state, sale_type, steps, created_at")
    .order("created_at", { ascending: true });

  const candidates = ((templates ?? []) as Array<{
    id: string;
    name: string;
    state: string | null;
    sale_type: string | null;
    steps: unknown;
    created_at: string;
  }>).filter(
    (t) =>
      (t.state == null || t.state === state) &&
      (t.sale_type == null || t.sale_type === saleType)
  );

  function specificity(t: { state: string | null; sale_type: string | null }) {
    return (t.state ? 2 : 0) + (t.sale_type ? 1 : 0);
  }
  candidates.sort((a, b) => {
    const d = specificity(b) - specificity(a);
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });

  const chosen = candidates[0] ?? null;
  let template: ResearchTemplate | null = null;
  if (chosen) {
    const steps = Array.isArray(chosen.steps)
      ? (chosen.steps as Array<Record<string, unknown>>).map((s) => ({
          name: String(s.name ?? ""),
          url: (s.url as string | null) ?? null,
          instructions: (s.instructions as string | null) ?? null,
        }))
      : [];
    template = {
      id: chosen.id,
      name: chosen.name,
      state: chosen.state,
      sale_type: chosen.sale_type,
      steps,
    };
  }

  const progressByIndex: Record<number, ResearchStepProgress> = {};
  if (template) {
    const { data: progressRows } = await sb
      .from("research_step_progress")
      .select("step_index, status, findings")
      .eq("lead_id", leadId)
      .eq("template_id", template.id);
    for (const row of (progressRows ?? []) as Array<{
      step_index: number;
      status: string;
      findings: string | null;
    }>) {
      progressByIndex[row.step_index] = {
        status: row.status,
        findings: row.findings,
      };
    }
  }

  return { template, progressByIndex, overallFindings };
}
