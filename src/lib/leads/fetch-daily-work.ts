import "server-only";
import { fetchNeedsActionLeads } from "./fetch-needs-action";
import type { LeadRow } from "./types";

export type DailyWorkLead = LeadRow & {
  stageName: string;
  days_in_stage: number;
  reason: string;
  unchecked_verifications: number;
};

export async function fetchDailyWork(): Promise<{
  needsAction: DailyWorkLead[];
  awaitingExternal: DailyWorkLead[];
}> {
  const { needsAction, awaitingExternal } = await fetchNeedsActionLeads();
  const needs: DailyWorkLead[] = needsAction.map((l) => ({
    ...l,
    unchecked_verifications: l.uncheckedVerifications,
    reason: l.reasonDetail,
  }));
  const awaiting: DailyWorkLead[] = awaitingExternal.map((l) => ({
    ...l,
    unchecked_verifications: 0,
  }));
  return { needsAction: needs, awaitingExternal: awaiting };
}
