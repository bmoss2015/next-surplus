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
  // Fetch every snapshot for these templates so we can compute both "active"
  // and "completed in last 30 days" in JS. Cheap at our scale; revisit if a
  // workspace grows large.
  const { data: lrts } = await sb
    .from("lead_research_templates")
    .select("source_template_id, steps, updated_at, leads!inner(archived)")
    .in("source_template_id", ids)
    .eq("leads.archived", false);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const active = new Map<string, number>();
  const completed30 = new Map<string, number>();

  for (const row of (lrts ?? []) as Array<{
    source_template_id: string;
    steps: unknown;
    updated_at: string;
  }>) {
    const steps = Array.isArray(row.steps) ? (row.steps as Array<{ done?: boolean }>) : [];
    const allDone = steps.length > 0 && steps.every((s) => s?.done === true);
    if (allDone) {
      const t = new Date(row.updated_at).getTime();
      if (!Number.isNaN(t) && t >= thirtyDaysAgo) {
        completed30.set(
          row.source_template_id,
          (completed30.get(row.source_template_id) ?? 0) + 1
        );
      }
    } else {
      active.set(
        row.source_template_id,
        (active.get(row.source_template_id) ?? 0) + 1
      );
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    state: r.state,
    saleType: r.sale_type,
    stepCount: Array.isArray(r.steps) ? r.steps.length : 0,
    activeLeads: active.get(r.id) ?? 0,
    completedLast30Days: completed30.get(r.id) ?? 0,
  }));
}
