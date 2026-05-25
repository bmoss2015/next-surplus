"use server";

import {
  validatePhone,
  getValidationUsage,
  previewBackfillCount,
  DEFAULT_CREDIT_COST_USD,
  type ValidationResult,
  type ValidationUsageSummary,
} from "@/lib/phone-validate";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/current-user";

export type TestRunResult =
  | {
      ok: true;
      phone: string;
      result: ValidationResult;
      // Live balance pulled fresh before and after the call so the user can see
      // whether a credit was actually consumed (cache hits should leave the
      // balance unchanged).
      balanceBefore: number | null;
      balanceAfter: number | null;
      creditDelta: number | null;
      timestampMs: number;
    }
  | { ok: false; error: string };

export async function testValidatePhone(phoneRaw: string): Promise<TestRunResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "No org" };
  const orgId = profile.orgId;

  if (!phoneRaw || !phoneRaw.trim()) {
    return { ok: false, error: "Enter a phone number" };
  }

  const before = await getValidationUsage(orgId);
  const start = Date.now();
  const result = await validatePhone(phoneRaw, orgId);
  const elapsed = Date.now() - start;
  const after = await getValidationUsage(orgId);

  const delta =
    before.remainingCredits != null && after.remainingCredits != null
      ? before.remainingCredits - after.remainingCredits
      : null;

  return {
    ok: true,
    phone: phoneRaw.trim(),
    result,
    balanceBefore: before.remainingCredits,
    balanceAfter: after.remainingCredits,
    creditDelta: delta,
    timestampMs: elapsed,
  };
}

export type RefreshBalanceResult =
  | { ok: true; usage: ValidationUsageSummary; costPerCreditUsd: number }
  | { ok: false; error: string };

export async function refreshBalance(): Promise<RefreshBalanceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "No org" };
  const usage = await getValidationUsage(profile.orgId);
  return { ok: true, usage, costPerCreditUsd: DEFAULT_CREDIT_COST_USD };
}

export type PreviewBackfillResult =
  | {
      ok: true;
      uniquePhones: number;
      totalRows: number;
      estimatedCostUsd: number;
      costPerCreditUsd: number;
    }
  | { ok: false; error: string };

export async function testPreviewBackfill(): Promise<PreviewBackfillResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "No org" };
  const { uniquePhones, totalRows } = await previewBackfillCount(profile.orgId, {
    excludeLostLeads: true,
  });
  return {
    ok: true,
    uniquePhones,
    totalRows,
    estimatedCostUsd: uniquePhones * DEFAULT_CREDIT_COST_USD,
    costPerCreditUsd: DEFAULT_CREDIT_COST_USD,
  };
}
