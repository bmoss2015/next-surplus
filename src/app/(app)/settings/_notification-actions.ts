"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Notification prefs — one row per (user_id, pref_key). Default is "enabled"
// for the activity prefs and "disabled" for the digest prefs; the absence of
// a row means we use that default.

export const NOTIFICATION_PREFS = [
  { key: "mentions",                  group: "activity", label: "Mentions",                       desc: "When a teammate @mentions you in a note or comment.",                            defaultOn: true  },
  { key: "lead_assigned",             group: "activity", label: "Lead Assigned To Me",            desc: "When someone assigns a lead to you, or you take ownership.",                      defaultOn: true  },
  { key: "inbound_email_reply",       group: "activity", label: "Inbound Email Reply",            desc: "When a contact replies to a thread you own.",                                     defaultOn: true  },
  { key: "stage_changed_on_my_lead",  group: "activity", label: "Stage Changed On A Lead I Own",  desc: "When another teammate moves one of your leads to a new pipeline stage.",         defaultOn: true  },
  { key: "daily_tasks_due",           group: "digest",   label: "Daily Tasks Due",                desc: "A morning summary of every task due in the next twenty-four hours.",              defaultOn: false },
  { key: "weekly_pipeline_summary",   group: "digest",   label: "Weekly Pipeline Summary",        desc: "A Monday-morning report of the team's pipeline movement over the past week.",     defaultOn: false },
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREFS)[number]["key"];

export async function setMyNotificationPref(
  prefKey: NotificationPrefKey,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  // Guard against arbitrary keys hitting the table.
  if (!NOTIFICATION_PREFS.some((p) => p.key === prefKey)) {
    return { ok: false, error: "Unknown notification preference" };
  }

  const sb = await createClient();
  const { error } = await sb
    .from("user_notification_prefs")
    .upsert(
      { user_id: profile.id, pref_key: prefKey, enabled, updated_at: new Date().toISOString() },
      { onConflict: "user_id,pref_key" }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
