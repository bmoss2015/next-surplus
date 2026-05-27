import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PlaybookBoard, PlaybookBoardLead, PlaybookStep } from "./types";

type StepDef = { name: string };
type SnapshotStep = { name?: string; done?: boolean };

function readSteps(raw: unknown): SnapshotStep[] {
  if (!Array.isArray(raw)) return [];
  return raw as SnapshotStep[];
}

function firstIncomplete(steps: SnapshotStep[]): number {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i]?.done !== true) return i;
  }
  return steps.length; // all done
}

export async function fetchPlaybookBoard(
  templateId: string
): Promise<PlaybookBoard | null> {
  const sb = await createClient();

  const { data: template } = await sb
    .from("research_templates")
    .select("id, name, steps")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return null;

  const stepDefs = (Array.isArray(template.steps) ? template.steps : []) as Array<{
    name?: string;
  }>;
  const stepNames: StepDef[] = stepDefs.map((s) => ({
    name: String(s.name ?? ""),
  }));

  // Pull every lead snapshot that traces back to this template, joined to lead
  // fields needed by the card.
  const { data: snapshots } = await sb
    .from("lead_research_templates")
    .select(
      `id, lead_id, steps, updated_at,
       leads!inner(
         id, lead_id, address, city, state, county,
         estimated_surplus, confirmed_surplus, stage, archived,
         owners(full_name, is_primary)
       )`
    )
    .eq("source_template_id", templateId);

  type LeadJoin = {
    id: string;
    lead_id: string;
    address: string;
    city: string;
    state: string;
    county: string | null;
    estimated_surplus: number | null;
    confirmed_surplus: number | null;
    stage: string;
    archived: boolean;
    owners: Array<{ full_name: string; is_primary: boolean }>;
  };
  const rows = (snapshots ?? []) as unknown as Array<{
    id: string;
    lead_id: string;
    steps: unknown;
    updated_at: string;
    // PostgREST returns the parent-side join as an array even when the FK is
    // many-to-one. Treat as array and pick [0].
    leads: LeadJoin[] | LeadJoin | null;
  }>;

  const steps: PlaybookStep[] = stepNames.map((s, i) => ({
    index: i,
    name: s.name || `Step ${i + 1}`,
    leads: [],
  }));
  const completed: PlaybookBoardLead[] = [];

  for (const row of rows) {
    const leadObj: LeadJoin | null = Array.isArray(row.leads)
      ? (row.leads[0] ?? null)
      : row.leads;
    if (!leadObj || leadObj.archived) continue;
    const snapSteps = readSteps(row.steps);
    const idx = firstIncomplete(snapSteps);
    const primary =
      leadObj.owners.find((o) => o.is_primary) ?? leadObj.owners[0];
    const surplus =
      leadObj.confirmed_surplus ?? leadObj.estimated_surplus ?? null;

    const daysInStep = (() => {
      const t = new Date(row.updated_at).getTime();
      if (Number.isNaN(t)) return null;
      return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
    })();

    const lead: PlaybookBoardLead = {
      id: leadObj.id,
      leadId: leadObj.lead_id,
      address: leadObj.address,
      city: leadObj.city,
      state: leadObj.state,
      county: leadObj.county,
      ownerName: primary?.full_name ?? null,
      surplus,
      surplusConfirmed: leadObj.confirmed_surplus != null,
      stage: leadObj.stage,
      currentStepIndex: idx,
      totalSteps: snapSteps.length,
      daysInStep,
    };

    if (idx >= snapSteps.length) {
      completed.push(lead);
    } else if (idx < steps.length) {
      steps[idx].leads.push(lead);
    }
  }

  return {
    templateId: template.id,
    templateName: template.name,
    steps,
    completedLeads: completed,
  };
}
