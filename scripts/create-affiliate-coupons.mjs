#!/usr/bin/env node
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const file = process.env.DOTENV_FILE ?? ".env.local";
  try {
    const raw = readFileSync(resolve(process.cwd(), file), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnv();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is required (set in env or .env.local)");
  process.exit(1);
}

const stripe = new Stripe(key);

const AFFILIATES = [
  {
    couponId: "NICK30",
    name: "Nick - 30% off 12 months",
    percentOff: 30,
    durationInMonths: 12,
    promotionCode: "NICK30",
  },
];

async function ensureCoupon(spec) {
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(spec.couponId);
    console.log(`[ok] coupon exists: ${spec.couponId}`);
  } catch (err) {
    if (err?.statusCode !== 404) throw err;
    coupon = await stripe.coupons.create({
      id: spec.couponId,
      name: spec.name,
      percent_off: spec.percentOff,
      duration: "repeating",
      duration_in_months: spec.durationInMonths,
    });
    console.log(`[created] coupon: ${spec.couponId}`);
  }

  const existing = await stripe.promotionCodes.list({
    coupon: coupon.id,
    code: spec.promotionCode,
    limit: 1,
  });
  if (existing.data.length > 0) {
    console.log(`[ok] promotion_code exists: ${spec.promotionCode} -> ${existing.data[0].id}`);
    return;
  }
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: spec.promotionCode,
  });
  console.log(`[created] promotion_code: ${spec.promotionCode} -> ${promo.id}`);
}

for (const spec of AFFILIATES) {
  await ensureCoupon(spec);
}

console.log("done.");
