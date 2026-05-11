"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/current-user";

type CreateTaskInput = {
  title: string;
  description?: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: "high" | "medium" | "low";
  lead_id: string | null;
  notes: string | null;
};

export async function createTask(
  input: CreateTaskInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  const sb = await createClient();
  const { data, error } = await sb
    .from("tasks")
    .insert({
      title,
      description: (input.description ?? "").trim(),
      due_date: input.due_date,
      due_time: input.due_time,
      priority: input.priority,
      source: "manual",
      lead_id: input.lead_id,
      notes: input.notes,
      user_id: null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (input.lead_id) {
    await sb.from("activities").insert({
      lead_id: input.lead_id,
      activity_type: "task_created",
      payload: { title, priority: input.priority },
    });
    revalidatePath(`/leads/${input.lead_id}`);
  }
  revalidatePath("/tasks");
  return { ok: true, id: data.id as string };
}

// Alias kept for callers (e.g. the lead-detail "Add Task" button) that import
// `addTask`. Behaves identically to `createTask`.
export async function addTask(
  input: CreateTaskInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  return createTask(input);
}

export async function updateTask(
  taskId: string,
  input: {
    title: string;
    description?: string | null;
    due_date: string | null;
    due_time: string | null;
    priority: "high" | "medium" | "low";
    lead_id: string | null;
    notes: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  const sb = await createClient();
  const { error } = await sb
    .from("tasks")
    .update({
      title,
      description: (input.description ?? "").trim(),
      due_date: input.due_date,
      due_time: input.due_time,
      priority: input.priority,
      lead_id: input.lead_id,
      notes: input.notes,
    })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  revalidatePath("/tasks");
  return { ok: true };
}

export async function toggleTaskCompleted(
  taskId: string,
  completed: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("tasks")
    .update({ completed })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(
  taskId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("tasks").delete().eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function bulkCompleteTasks(
  taskIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (taskIds.length === 0) return { ok: true };
  const sb = await createClient();
  const { error } = await sb
    .from("tasks")
    .update({ completed: true })
    .in("id", taskIds);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function bulkDeleteTasks(
  taskIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (taskIds.length === 0) return { ok: true };
  const sb = await createClient();
  const { error } = await sb.from("tasks").delete().in("id", taskIds);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}
