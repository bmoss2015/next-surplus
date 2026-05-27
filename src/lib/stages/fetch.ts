import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrgStage, StageKind } from "./types";

export async function fetchOrgStages(): Promise<OrgStage[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("org_stages")
    .select("id, name, position, kind, is_active")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    position: number;
    kind: StageKind;
    is_active: boolean;
  }>;

  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: leadRows } = await sb
      .from("leads")
      .select("stage_id")
      .in("stage_id", ids)
      .eq("archived", false);
    for (const lr of (leadRows ?? []) as Array<{ stage_id: string }>) {
      counts.set(lr.stage_id, (counts.get(lr.stage_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    position: r.position,
    kind: r.kind,
    isActive: r.is_active,
    activeLeadCount: counts.get(r.id) ?? 0,
  }));
}
