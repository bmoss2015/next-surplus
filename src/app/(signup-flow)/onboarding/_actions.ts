"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveFirmProfile(input: {
  name: string;
  primaryState: string;
}): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, error: "No workspace found." };

  const { error } = await admin
    .from("orgs")
    .update({
      name: input.name.trim(),
      primary_state: input.primaryState,
    })
    .eq("id", profile.org_id);

  if (error) {
    if (error.message?.includes("primary_state")) {
      const { error: nameOnlyErr } = await admin
        .from("orgs")
        .update({ name: input.name.trim() })
        .eq("id", profile.org_id);
      if (nameOnlyErr) return { ok: false, error: nameOnlyErr.message };
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function inviteTeammates(input: {
  emails: string[];
}): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, error: "No workspace found." };

  const rows = input.emails.map((email) => ({
    org_id: profile.org_id,
    email: email.toLowerCase(),
    invited_by: user.id,
    role: "member",
  }));

  const { error } = await admin.from("invite_tokens").insert(rows);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
