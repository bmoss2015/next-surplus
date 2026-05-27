import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PlaybookListItem } from "./types";

// Lists every research template in the org, with the count of leads whose
// snapshotted checklist points back to it. Powers /playbooks (the index page).
export async function fetchPlaybooks(): Promise<PlaybookListItem[]> {
  const sb = await createClient();

  const { data: templates, error } = await sb
    .from("research_templates")
    .select("id, name, state, sale_type, steps")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (templates ?? []) as Array<{
    id: string;
    name: string;
    state: string | null;
    sale_type: string | null;
    steps: unknown;
  }>;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  // Count active (non-archived) leads currently using each template by joining
  // through lead_research_templates -> leads and grouping in JS.
  const { data: lrts } = await sb
    .from("lead_research_templates")
    .select("source_template_id, lead_id, leads!inner(archived)")
    .in("source_template_id", ids)
    .eq("leads.archived", false);

  const counts = new Map<string, number>();
  for (const row of (lrts ?? []) as Array<{ source_template_id: string }>) {
    counts.set(
      row.source_template_id,
      (counts.get(row.source_template_id) ?? 0) + 1
    );
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    state: r.state,
    saleType: r.sale_type,
    stepCount: Array.isArray(r.steps) ? r.steps.length : 0,
    activeLeads: counts.get(r.id) ?? 0,
  }));
}
