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
  return ((data ?? []) as Array<{
    id: string;
    name: string;
    position: number;
    kind: StageKind;
    is_active: boolean;
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    position: r.position,
    kind: r.kind,
    isActive: r.is_active,
  }));
}
