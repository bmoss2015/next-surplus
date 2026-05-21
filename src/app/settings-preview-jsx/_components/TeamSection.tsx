// Settings clone · Phase C.3 — Members (Team) wired to real data (display).
//
// Reads the org's member roster from OrgMemberRow[]. Hero stats are
// computed from the roster. The Invite Member button and the per-row
// overflow menu are visual-only — invite/role-change/remove flows ship
// in Phase D.

import type { OrgMemberRow } from "@/lib/settings/fetch";

function avatarInitials(name: string, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtJoined(_unused: OrgMemberRow): string {
  // Member rows don't carry a join date in the public schema. Phase D will
  // add it from the auth.users metadata pull.
  return "";
}

export function TeamSection({
  initial,
  orgName,
}: {
  initial: OrgMemberRow[];
  orgName: string;
}) {
  const total = initial.length;
  const active = initial.filter((m) => !m.pending).length;
  const pending = initial.filter((m) => m.pending).length;
  const admins = initial.filter((m) => m.role === "admin").length;

  const adminRows = initial.filter((m) => m.role === "admin");
  const memberRows = initial.filter((m) => m.role !== "admin" && !m.pending);
  const pendingRows = initial.filter((m) => m.pending);

  return (
    <section id="panel-team" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Workspace</a>
        <i className="icon icon-chevron-right" />
        <span>Members</span>
      </div>

      <div className="hero-dark">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="hero-eyebrow">Your Team</div>
            <div className="hero-title">{orgName}</div>
          </div>
          <button
            type="button"
            className="btn btn-light"
            disabled
            title="Invite drawer ships in Phase D"
          >
            <i className="icon icon-user-plus" /> Invite Member
          </button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="num">{total}</div>
            <div className="lab">Members</div>
          </div>
          <div className="hero-stat">
            <div className="num">{active}</div>
            <div className="lab">Active</div>
          </div>
          <div className="hero-stat">
            <div className="num">{pending}</div>
            <div className="lab">Pending</div>
          </div>
          <div className="hero-stat">
            <div className="num">{admins}</div>
            <div className="lab">Admin</div>
          </div>
        </div>
      </div>

      <div className="group-h">Members</div>

      <div
        className="list members-list"
        data-role-style="ribbon"
        data-tab-scheme="ink"
      >
        {adminRows.length > 0 && (
          <>
            <div className="role-group-h">Admins</div>
            {adminRows.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </>
        )}
        {memberRows.length > 0 && (
          <>
            <div className="role-group-h">Members</div>
            {memberRows.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </>
        )}
        {pendingRows.length > 0 && (
          <>
            <div className="role-group-h">Pending</div>
            {pendingRows.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function Row({ m }: { m: OrgMemberRow }) {
  const av =
    m.role === "admin" ? "av-self" : m.pending ? "av-5" : "av-1";
  const roleTab =
    m.pending ? "PENDING" : m.role === "admin" ? "ADMIN" : "MEMBER";
  return (
    <div className="list-row" data-role={m.pending ? "pending" : m.role}>
      <div className={`avatar ${av} av-fill`}>{avatarInitials(m.full_name, m.email)}</div>
      <div className="flex-1 min-w-0">
        <div className="row-name text-[13.5px] font-medium">
          {m.full_name || m.email || "Unknown"}
        </div>
        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
          {m.email ?? ""}
          {fmtJoined(m)}
        </div>
      </div>
      <span className="role-tab">{roleTab}</span>
      <div className="overflow">
        <div
          className="icon-btn"
          title="Manage (coming in Phase D)"
          style={{ opacity: 0.4, pointerEvents: "none" }}
        >
          <i className="icon icon-more-horizontal" />
        </div>
      </div>
    </div>
  );
}
