// Playbook (research template) board / list types.
//
// A "Playbook" is the cross-lead view of a research template: each column is a
// template step, each card is a lead currently sitting on that step. Current
// step = the first incomplete step in the lead's snapshotted checklist.

export type PlaybookListItem = {
  id: string;
  name: string;
  state: string | null;
  saleType: string | null;
  stepCount: number;
  activeLeads: number;
};

export type PlaybookBoardLead = {
  id: string;
  leadId: string;
  address: string;
  city: string;
  state: string;
  county: string | null;
  ownerName: string | null;
  surplus: number | null;
  surplusConfirmed: boolean;
  stage: string;
  currentStepIndex: number;
  totalSteps: number;
  daysInStep: number | null;
};

export type PlaybookStep = {
  index: number;
  name: string;
  leads: PlaybookBoardLead[];
};

export type PlaybookBoard = {
  templateId: string;
  templateName: string;
  steps: PlaybookStep[];
  completedLeads: PlaybookBoardLead[];
};
