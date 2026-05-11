// One-time: create Bree's admin user.
// Run: node --env-file=.env.local scripts/create-admin-user.mjs
// Idempotent: if the user already exists it prints the existing id.

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env. Run with: node --env-file=.env.local scripts/create-admin-user.mjs");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = "info@mossyland.com";

// Check if user exists by listing
const { data: existing } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
const found = existing.users.find((u) => u.email?.toLowerCase() === email);
if (found) {
  console.log("User already exists:");
  console.log("  id:", found.id);
  console.log("  email:", found.email);
  process.exit(0);
}

// Generate a memorable but secure temp password
const tempPassword = `MossEquity-${crypto.randomBytes(4).toString("hex")}!`;

const { data, error } = await sb.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
  user_metadata: { full_name: "Bree Moss", role: "admin" },
});
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Admin user created");
console.log("  id:", data.user.id);
console.log("  email:", data.user.email);
console.log("  temp password:", tempPassword);
console.log();
console.log("Save this password somewhere safe and change it after first login.");
