"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/current-user";

export type AssignmentType = "specific" | "round_robin";

export type SaveWebFormInput = {
  id: string;
  name?: string;
  is_active?: boolean;
  assignment_type?: AssignmentType;
  assigned_to?: string | null;
  round_robin_users?: string[];
  default_stage?: string;
  success_message?: string;
};

export async function saveWebForm(
  input: SaveWebFormInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const sb = await createClient();
  const update: Record<string, unknown> = {};
  if (typeof input.name === "string") update.name = input.name.trim() || "Website Contact Form";
  if (typeof input.is_active === "boolean") update.is_active = input.is_active;
  if (input.assignment_type) update.assignment_type = input.assignment_type;
  if (input.assigned_to !== undefined) update.assigned_to = input.assigned_to;
  if (input.round_robin_users) update.round_robin_users = input.round_robin_users;
  if (typeof input.default_stage === "string") update.default_stage = input.default_stage;
  if (typeof input.success_message === "string") update.success_message = input.success_message;

  const { error } = await sb.from("web_forms").update(update).eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/automations");
  return { ok: true };
}
