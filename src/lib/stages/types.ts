export const STAGE_KINDS = ["open", "won", "lost"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const STAGE_KIND_LABELS: Record<StageKind, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
};

export type OrgStage = {
  id: string;
  name: string;
  position: number;
  kind: StageKind;
  isActive: boolean;
};

export const MAX_STAGES = 20;
export const SOFT_STAGE_LIMIT = 10;
