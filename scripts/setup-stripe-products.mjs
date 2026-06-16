#!/usr/bin/env node
// One-shot Stripe catalog + webhook setup.
//
// Reads STRIPE_SECRET_KEY from env (falls back to .env.preview-temp,
// .env.prod-temp, .env.local in that order). Detects test vs live from
// the key prefix. Idempotent: re-running checks for existing objects
// before creating, so it's safe to invoke multiple times.
//
// What it creates:
//   - Product "Next Surplus" (or reuses existing match by name)
//   - Three recurring prices, identified by lookup_key:
//       beta_founder_monthly  $49 / month
//       beta_founder_annual   $470 / year
//       standard_monthly      $69 / month
//   - Webhook endpoint at the provided URL listening for the five
//     subscription / invoice events the handler in
//     src/app/api/webhooks/stripe/route.ts expects
//
// On success prints a ready-to-paste Vercel env-var block including
// the webhook signing secret. Run twice: once with the test secret
// (output -> Preview env), once with the live secret (output ->
// Production env).
//
// Usage:
//   node scripts/setup-stripe-products.mjs [webhook-url]
//
// webhook-url defaults to https://app.nextsurplus.com/api/webhooks/stripe.

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.join(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/(\w):/, "$1:"),
  ".."
);

function readEnvValue(file, key) {
  const p = path.join(REPO_ROOT, file);
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, "utf-8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (!m || m[1] !== key) continue;
    let v = m[2];
    if (
      (v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"'))
    ) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return null;
}

const SECRET =
  process.env.STRIPE_SECRET_KEY ||
  readEnvValue(".env.preview-temp", "STRIPE_SECRET_KEY") ||
  readEnvValue(".env.prod-temp", "STRIPE_SECRET_KEY") ||
  readEnvValue(".env.local", "STRIPE_SECRET_KEY");

if (!SECRET) {
  console.error("STRIPE_SECRET_KEY not set in env or any .env file.");
  process.exit(1);
}

const MODE = SECRET.startsWith("sk_live_") || SECRET.startsWith("rk_live_")
  ? "live"
  : SECRET.startsWith("sk_test_") || SECRET.startsWith("rk_test_")
  ? "test"
  : null;

if (!MODE) {
  console.error(
    `STRIPE_SECRET_KEY has an unrecognized prefix. Expected sk_live_, sk_test_, rk_live_, or rk_test_.`
  );
  process.exit(1);
}

const WEBHOOK_URL =
  process.argv[2] || "https://app.nextsurplus.com/api/webhooks/stripe";

const PRODUCT_NAME = "Next Surplus";
const PRICES = [
  {
    lookup_key: "beta_founder_monthly",
    nickname: "Founders Rate (Monthly)",
    unit_amount: 4900,
    interval: "month",
  },
  {
    lookup_key: "beta_founder_annual",
    nickname: "Founders Rate (Annual)",
    unit_amount: 47000,
    interval: "year",
  },
  {
    lookup_key: "standard_monthly",
    nickname: "Standard (Monthly)",
    unit_amount: 6900,
    interval: "month",
  },
];
const WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

async function stripe(method, path, body) {
  const url = `https://api.stripe.com/v1${path}`;
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${SECRET}`,
    },
  };
  if (body) {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = formEncode(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text}`);
  }
  if (!res.ok) {
    throw new Error(
      `Stripe ${method} ${path} -> ${res.status}: ${json.error?.message || text}`
    );
  }
  return json;
}

function formEncode(obj, prefix) {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object") {
          parts.push(formEncode(item, `${key}[${i}]`));
        } else {
          parts.push(
            `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`
          );
        }
      });
    } else if (typeof v === "object") {
      parts.push(formEncode(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

async function findOrCreateProduct() {
  const search = await stripe(
    "GET",
    `/products/search?query=${encodeURIComponent(`name:'${PRODUCT_NAME}' AND active:'true'`)}&limit=1`
  );
  if (search.data?.length) {
    console.log(`Product '${PRODUCT_NAME}' already exists: ${search.data[0].id}`);
    return search.data[0];
  }
  const created = await stripe("POST", "/products", {
    name: PRODUCT_NAME,
    description:
      "Operations platform for surplus funds recovery firms. Lead pipeline, email integration, document management, unlimited users.",
    statement_descriptor: "NEXT SURPLUS",
  });
  console.log(`Created product: ${created.id}`);
  return created;
}

async function findOrCreatePrice(product, spec) {
  const existing = await stripe(
    "GET",
    `/prices?lookup_keys[]=${encodeURIComponent(spec.lookup_key)}&active=true&limit=1`
  );
  if (existing.data?.length) {
    const p = existing.data[0];
    console.log(
      `Price '${spec.lookup_key}' already exists: ${p.id} (${p.unit_amount} ${p.currency}/${p.recurring.interval})`
    );
    return p;
  }
  const created = await stripe("POST", "/prices", {
    product: product.id,
    currency: "usd",
    unit_amount: spec.unit_amount,
    nickname: spec.nickname,
    lookup_key: spec.lookup_key,
    "recurring[interval]": spec.interval,
    "recurring[usage_type]": "licensed",
    tax_behavior: "exclusive",
  });
  console.log(
    `Created price '${spec.lookup_key}': ${created.id} ($${(spec.unit_amount / 100).toFixed(2)} / ${spec.interval})`
  );
  return created;
}

async function findOrCreateWebhook() {
  const list = await stripe("GET", "/webhook_endpoints?limit=100");
  const existing = list.data?.find((w) => w.url === WEBHOOK_URL);
  if (existing) {
    const missing = WEBHOOK_EVENTS.filter(
      (e) => !existing.enabled_events.includes(e)
    );
    if (missing.length === 0) {
      console.log(
        `Webhook endpoint already exists: ${existing.id} (events match)`
      );
      return { endpoint: existing, secret: null };
    }
    console.log(
      `Webhook endpoint exists: ${existing.id} but is missing events: ${missing.join(", ")}. Updating.`
    );
    const updated = await stripe("POST", `/webhook_endpoints/${existing.id}`, {
      enabled_events: [...new Set([...existing.enabled_events, ...missing])],
    });
    return { endpoint: updated, secret: null };
  }
  const created = await stripe("POST", "/webhook_endpoints", {
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: "Subscription lifecycle and invoice events for Next Surplus orgs",
  });
  console.log(`Created webhook endpoint: ${created.id}`);
  return { endpoint: created, secret: created.secret };
}

async function main() {
  console.log(`Mode: ${MODE.toUpperCase()}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log("");

  const product = await findOrCreateProduct();
  const priceMap = {};
  for (const spec of PRICES) {
    const p = await findOrCreatePrice(product, spec);
    priceMap[spec.lookup_key] = p.id;
  }
  const { endpoint, secret } = await findOrCreateWebhook();

  console.log("");
  console.log("==============================================================");
  console.log(`Vercel env vars for ${MODE.toUpperCase()} mode:`);
  console.log("==============================================================");
  console.log(`STRIPE_SECRET_KEY=<your ${MODE} secret, set this manually>`);
  console.log(
    `STRIPE_WEBHOOK_SECRET=${secret ?? "<pull from Dashboard, signing secret is only returned on initial create>"}`
  );
  console.log(
    `STRIPE_BETA_FOUNDER_MONTHLY_PRICE_ID=${priceMap.beta_founder_monthly}`
  );
  console.log(
    `STRIPE_BETA_FOUNDER_ANNUAL_PRICE_ID=${priceMap.beta_founder_annual}`
  );
  console.log(`STRIPE_STANDARD_MONTHLY_PRICE_ID=${priceMap.standard_monthly}`);
  console.log("==============================================================");
  if (!secret && endpoint) {
    console.log("");
    console.log(
      `Signing secret was NOT returned (webhook already existed). To fetch it:`
    );
    console.log(
      `  https://dashboard.stripe.com/${MODE === "test" ? "test/" : ""}webhooks/${endpoint.id}`
    );
    console.log(`  Click 'Reveal' next to 'Signing secret'.`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
