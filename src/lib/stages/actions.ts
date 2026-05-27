"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_STAGES, type StageKind } from "./types";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createStage(input: {
  name: string;
  kind: StageKind;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const sb = await createClient();
  const { count } = await sb
    .from("org_stages")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  if ((count ?? 0) >= MAX_STAGES) {
    return { ok: false, error: `Limit reached (${MAX_STAGES} stages)` };
  }

  const { data: maxRow } = await sb
    .from("org_stages")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { error } = await sb
    .from("org_stages")
    .insert({ name, kind: input.kind, position: nextPosition });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

export async function updateStage(input: {
  id: string;
  name?: string;
  kind?: StageKind;
}): Promise<ActionResult> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) return { ok: false, error: "Name is required" };
    patch.name = trimmed;
  }
  if (input.kind !== undefined) patch.kind = input.kind;
  if (Object.keys(patch).length === 0) return { ok: true };

  const sb = await createClient();
  const { error } = await sb.from("org_stages").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

export async function reorderStages(orderedIds: string[]): Promise<ActionResult> {
  const sb = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await sb
      .from("org_stages")
      .update({ position: i })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteStage(input: {
  id: string;
  moveLeadsToStageId: string | null;
}): Promise<ActionResult> {
  const sb = await createClient();

  const { data: target } = await sb
    .from("org_stages")
    .select("id, kind")
    .eq("id", input.id)
    .maybeSingle();
  if (!target) return { ok: false, error: "Stage not found" };

  const { count: leadCount } = await sb
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("stage_id", input.id)
    .eq("archived", false);

  if ((leadCount ?? 0) > 0) {
    if (!input.moveLeadsToStageId) {
      return {
        ok: false,
        error: `${leadCount} active leads use this stage. Pick another stage to move them to.`,
      };
    }
    const { error: moveErr } = await sb
      .from("leads")
      .update({ stage_id: input.moveLeadsToStageId })
      .eq("stage_id", input.id);
    if (moveErr) return { ok: false, error: moveErr.message };
  }

  const { count: kindCount } = await sb
    .from("org_stages")
    .select("*", { count: "exact", head: true })
    .eq("kind", target.kind)
    .eq("is_active", true);
  if ((kindCount ?? 0) <= 1) {
    return {
      ok: false,
      error: `Can't delete the only ${target.kind} stage. Mark another stage as ${target.kind} first.`,
    };
  }

  const { error: deactivateErr } = await sb
    .from("org_stages")
    .update({ is_active: false })
    .eq("id", input.id);
  if (deactivateErr) return { ok: false, error: deactivateErr.message };

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}
