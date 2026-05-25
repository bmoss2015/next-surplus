// Scenario catalog for the mail-send harness. Keeps server/client in lock-
// step on what each row in the grid is supposed to exercise.

export type ScenarioId =
  | "blank_bw"
  | "blank_color"
  | "blank_check"
  | "template_bw"
  | "template_color"
  | "template_check"
  | "multipage_bw"
  | "multipage_color"
  | "multipage_check"
  | "multi_recipients"
  | "gate_empty_body"
  | "gate_missing_bank"
  | "gate_zero_check"
  | "gate_empty_recipients"
  | "gate_missing_company";

export type ScenarioExpect = "pass" | "block";

export type Scenario = {
  id: ScenarioId;
  label: string;
  group: "happy" | "gate";
  body: "short" | "merged" | "long" | "empty";
  color: boolean;
  check: { include: true; amount_cents: number } | { include: false };
  recipients: 1 | 3 | 0;
  expect: ScenarioExpect;
  // Substring we expect the gate to surface in the error message.
  expectedErrorContains?: string;
  // Force the scenario to omit the bank account even when include_check=true,
  // so we can test the "Pick a bank account" gate.
  omitBank?: boolean;
  // Force the scenario to nuke the org name before sending so we can test
  // the "Set your Company Name" gate. Restored on cleanup.
  omitCompanyName?: boolean;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "blank_bw",
    label: "Blank letter — B&W — 1 recipient",
    group: "happy",
    body: "short",
    color: false,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "blank_color",
    label: "Blank letter — Color — 1 recipient",
    group: "happy",
    body: "short",
    color: true,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "blank_check",
    label: "Blank letter + check — 1 recipient",
    group: "happy",
    body: "short",
    color: false,
    check: { include: true, amount_cents: 12345 },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "template_bw",
    label: "Template letter — B&W — 1 recipient",
    group: "happy",
    body: "merged",
    color: false,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "template_color",
    label: "Template letter — Color — 1 recipient",
    group: "happy",
    body: "merged",
    color: true,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "template_check",
    label: "Template letter + check — 1 recipient",
    group: "happy",
    body: "merged",
    color: false,
    check: { include: true, amount_cents: 9900 },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "multipage_bw",
    label: "Multi-page letter — B&W — 1 recipient",
    group: "happy",
    body: "long",
    color: false,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "multipage_color",
    label: "Multi-page letter — Color — 1 recipient",
    group: "happy",
    body: "long",
    color: true,
    check: { include: false },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "multipage_check",
    label: "Multi-page letter + check — 1 recipient",
    group: "happy",
    body: "long",
    color: false,
    check: { include: true, amount_cents: 5000 },
    recipients: 1,
    expect: "pass",
  },
  {
    id: "multi_recipients",
    label: "Blank letter — B&W — 3 recipients (bulk-of-N)",
    group: "happy",
    body: "short",
    color: false,
    check: { include: false },
    recipients: 3,
    expect: "pass",
  },
  {
    id: "gate_empty_body",
    label: "Empty body — should be blocked",
    group: "gate",
    body: "empty",
    color: false,
    check: { include: false },
    recipients: 1,
    expect: "block",
    expectedErrorContains: "Body is required",
  },
  {
    id: "gate_missing_bank",
    label: "Check requested with no bank — should be blocked",
    group: "gate",
    body: "short",
    color: false,
    check: { include: true, amount_cents: 1000 },
    recipients: 1,
    expect: "block",
    omitBank: true,
    expectedErrorContains: "Pick a bank account",
  },
  {
    id: "gate_zero_check",
    label: "Check amount of $0 — should be blocked",
    group: "gate",
    body: "short",
    color: false,
    check: { include: true, amount_cents: 0 },
    recipients: 1,
    expect: "block",
    expectedErrorContains: "greater than zero",
  },
  {
    id: "gate_empty_recipients",
    label: "Zero recipients — should be blocked",
    group: "gate",
    body: "short",
    color: false,
    check: { include: false },
    recipients: 0,
    expect: "block",
    expectedErrorContains: "at least one recipient",
  },
  {
    id: "gate_missing_company",
    label: "Missing Company Name in Settings — should be blocked",
    group: "gate",
    body: "short",
    color: false,
    check: { include: false },
    recipients: 1,
    expect: "block",
    omitCompanyName: true,
    expectedErrorContains: "Company Name",
  },
];

// Stable tag used to mark every artifact the harness creates so cleanup
// can wipe them without touching real data.
export const HARNESS_TAG = "__mailtest__";
