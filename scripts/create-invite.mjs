// Generate an invite token for a specific email.
// Run: node --env-file=.env.local scripts/create-invite.mjs <email>

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env. Run: node --env-file=.env.local scripts/create-invite.mjs <email>");
  process.exit(1);
}
const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/create-invite.mjs <email>");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const token = crypto.randomBytes(24).toString("hex");
const { error } = await sb.from("invite_tokens").insert({
  token,
  email,
  expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
});
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Invite token created");
console.log("  email:", email);
console.log("  token:", token);
console.log("  signup link:", `http://localhost:3000/signup?token=${token}`);
console.log("  expires: 14 days");
