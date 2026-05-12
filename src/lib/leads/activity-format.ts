import { STAGE_LABELS, type Stage } from "./types";

export type ActivityRow = {
  id: string;
  lead_id?: string;
  activity_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  user_id?: string | null;
  // Joined first name of the user who triggered the entry, when available.
  actor_first_name?: string | null;
};

// Resolves the display name for who triggered an activity. System-generated
// rows (no user_id) show "System".
export function activityActorName(row: {
  user_id?: string | null;
  actor_first_name?: string | null;
}): string {
  if (!row.user_id) return "System";
  const name = (row.actor_first_name ?? "").trim();
  return name.length > 0 ? name : "System";
}

// Pulls the first name out of a full name or email local-part.
export function firstNameFrom(
  fullName: string | null | undefined,
  email: string | null | undefined
): string | null {
  const name = (fullName ?? "").trim();
  if (name.length > 0) {
    const first = name.split(/\s+/)[0];
    if (first) return first;
  }
  const local = (email ?? "").split("@")[0]?.trim();
  return local && local.length > 0 ? local : null;
}

// Detects whether a lead was created by a CSV import vs. manual entry, based on
// its lead_source. Manual entries use the source "Manual entry"; everything else
// (and unknown) is treated as an import-only when it clearly isn't manual —
// otherwise we default to "Created" to be safe.
function leadWasImported(leadSource: string | null | undefined): boolean {
  const src = (leadSource ?? "").trim().toLowerCase();
  if (src.length === 0) return false; // unknown -> default to "Created"
  if (src === "manual entry" || src === "manual") return false;
  return true;
}

export function formatActivity(
  row: { activity_type: string; payload: Record<string, unknown> },
  opts?: { leadSource?: string | null }
): {
  text: string;
  icon: "create" | "stage" | "note" | "review" | "doc" | "default";
} {
  const p = row.payload ?? {};
  switch (row.activity_type) {
    case "lead_created":
      return {
        text: leadWasImported(opts?.leadSource) ? "Lead Imported" : "Lead Created",
        icon: "create",
      };
    case "stage_change": {
      const from = STAGE_LABELS[(p.from as Stage) ?? "new_leads"];
      const to = STAGE_LABELS[(p.to as Stage) ?? "new_leads"];
      return { text: `Stage Moved From ${from} To ${to}`, icon: "stage" };
    }
    case "note": {
      const kind = p.kind as string | undefined;
      const body = (p.body as string) ?? (p.reason as string) ?? "";
      if (kind === "review_pause") {
        return {
          text: `Paused For Review${body ? ` — ${body}` : ""}`,
          icon: "review",
        };
      }
      return { text: body ? `Note: ${body}` : "Note Added", icon: "note" };
    }
    case "document_uploaded":
      return {
        text: `Document Uploaded${p.filename ? ` — ${p.filename as string}` : ""}`,
        icon: "doc",
      };
    case "task_created":
      return {
        text: `Task Created${p.title ? ` — ${p.title as string}` : ""}`,
        icon: "note",
      };
    case "task_completed":
      return {
        text: `Task Completed${p.title ? ` — ${p.title as string}` : ""}`,
        icon: "note",
      };
    case "verification_added":
      return { text: "Pre Call Checklist Item Added", icon: "note" };
    case "verification_checked":
      return { text: "Pre Call Checklist Item Checked", icon: "note" };
    case "research_update":
      return {
        text: (p.text as string) ?? "Research Updated",
        icon: "default",
      };
    case "assignment_change": {
      const name = ((p.full_name as string | null) ?? "").trim();
      return {
        text: name ? `Lead Assigned To ${name}` : "Lead Unassigned",
        icon: "default",
      };
    }
    case "mailer_marked_sent": {
      const text = ((p.text as string | null) ?? "").trim();
      if (text) return { text, icon: "default" };
      return { text: p.mailed === false ? "Mailer Status Cleared" : "Mailer Sent", icon: "default" };
    }
    default:
      return { text: toTitleish(row.activity_type.replace(/_/g, " ")), icon: "default" };
  }
}

function toTitleish(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Exact note byline, e.g. "Bree · May 11, 2026 · 2:34 PM".
export function noteByline(
  iso: string,
  actor: { user_id?: string | null; actor_first_name?: string | null }
): string {
  const name = activityActorName(actor);
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${name} · ${date} · ${time}`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.floor(diffMo / 12)}y ago`;
}
