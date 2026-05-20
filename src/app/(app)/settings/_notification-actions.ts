"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { NOTIFICATION_PREFS, type NotificationPrefKey } from "./_notification-prefs";

// Notification prefs — write/update only. Constants live in
// _notification-prefs.ts because Next.js server-action files can't export
// non-function values.

export async function setMyNotificationPref(
  prefKey: NotificationPrefKey,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

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
