"use client";

// Settings clone · Phase D.2 — Members (Team) with Invite drawer + per-row
// role/remove menu.
//
// Reads OrgMemberRow[] + the current user's id. Invite Member opens the
// InviteMemberDrawer. Per-row three-dot menu opens MemberOverflow which
// supports flip-role + remove. Self-row gets a disabled trigger (server
// also blocks self-edits).

import { useState } from "react";
import { IconChevronRight, IconUserPlus } from "@tabler/icons-react";
import type { OrgMemberRow } from "@/lib/settings/fetch";
import { InviteMemberDrawer } from "./InviteMemberDrawer";
import { MemberOverflow } from "./MemberOverflow";

function avatarInitials(name: string, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamSection({
  initial,
  orgName,
  currentUserId,
}: {
  initial: OrgMemberRow[];
  orgName: string;
  currentUserId: string;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const isAdminRole = (m: OrgMemberRow) =>
    m.role === "admin" || m.role === "owner";

  const total = initial.length;
  const active = initial.filter((m) => !m.pending).length;
  const pending = initial.filter((m) => m.pending).length;
  const admins = initial.filter(isAdminRole).length;

  const adminRows = initial.filter((m) => isAdminRole(m) && !m.pending);
  const memberRows = initial.filter((m) => !isAdminRole(m) && !m.pending);
  const pendingRows = initial.filter((m) => m.pending);

  return (
    <section id="panel-team" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <IconChevronRight size={12} stroke={1.75} />
        <a>Workspace</a>
        <IconChevronRight size={12} stroke={1.75} />
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
            onClick={() => setInviteOpen(true)}
          >
            <IconUserPlus size={16} stroke={1.75} /> Invite Member
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
              <Row key={m.id} m={m} isSelf={m.id === currentUserId} />
            ))}
          </>
        )}
        {memberRows.length > 0 && (
          <>
            <div className="role-group-h">Members</div>
            {memberRows.map((m) => (
              <Row key={m.id} m={m} isSelf={m.id === currentUserId} />
            ))}
          </>
        )}
        {pendingRows.length > 0 && (
          <>
            <div className="role-group-h">Pending</div>
            {pendingRows.map((m) => (
              <Row key={m.id} m={m} isSelf={m.id === currentUserId} />
            ))}
          </>
        )}
      </div>

      <InviteMemberDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </section>
  );
}

function Row({ m, isSelf }: { m: OrgMemberRow; isSelf: boolean }) {
  const isAdminLike = m.role === "admin" || m.role === "owner";
  const av = isAdminLike ? "av-self" : m.pending ? "av-5" : "av-1";
  const roleTab = m.pending ? "PENDING" : isAdminLike ? "ADMIN" : "MEMBER";
  const dataRole = m.pending ? "pending" : isAdminLike ? "admin" : "member";
  return (
    <div className="list-row" data-role={dataRole}>
      <div className={`avatar ${av} av-fill`}>{avatarInitials(m.full_name, m.email)}</div>
      <div className="flex-1 min-w-0">
        <div className="row-name text-[13.5px] font-medium">
          {m.full_name || m.email || "Unknown"}
        </div>
        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
          {m.email ?? ""}
        </div>
      </div>
      <span className="role-tab">{roleTab}</span>
      <MemberOverflow member={m} isSelf={isSelf} />
    </div>
  );
}
