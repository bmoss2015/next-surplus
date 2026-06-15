import type { SampleLead } from "./_sample";

export type AiBrief = {
  headline: string;
  tldr: string;
  bullets: string[];
  watchOuts: string[];
};

export function aiBriefFor(lead: SampleLead): AiBrief {
  return {
    headline: `Heir-friendly. Family agreed on a joint Tuesday window.`,
    tldr: `Cornelius Jr. confirmed the surplus is real and committed to a callback Tuesday morning with his sister Yvette. Estate is in probate, both heirs reachable on mobile, no competing firm contact yet.`,
    bullets: [
      "Decedent: Cornelius J. Hayes Sr. Estate in probate, case 2026-PR-0488.",
      "Two reachable heirs (Cornelius Jr., Yvette). Yvette's window is 12:30 to 1:30 PM ET.",
      `Estimated net fee to firm ${money(lead.estimatedNet)} at ${lead.recoveryFeePercent}% recovery.`,
      "Karen Hayes confirmed wrong number, marked. Estate landline disconnected.",
    ],
    watchOuts: [
      "Fee objection raised last call (felt high). Reframe with attorney + bond + title-search breakdown.",
      "Avoid pitching solo. Both heirs want to hear it together.",
    ],
  };
}

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
