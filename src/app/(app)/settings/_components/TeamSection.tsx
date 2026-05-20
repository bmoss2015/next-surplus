"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconX, IconTrash } from "@tabler/icons-react";
import { inviteMember, setMemberRole, removeMember } from "../_actions";
import { cn } from "@/lib/cn";
import type { OrgMemberRow } from "@/lib/settings/fetch";

// Settings redesign — Members panel.
// List rows use the new ribbon-tab role indicators (ADMIN = ink, MEMBER =
// light gray, PENDING = brand outline). Invite Member opens a right-side
// drawer (drawer-panel + drawer-backdrop classes from globals.css) instead
// of an inline modal.

function initials(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamSection({
  initial,
  currentUserId,
}: {
  initial: OrgMemberRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [editedRoles, setEditedRoles] = useState<Record<string, "admin" | "member">>({});
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMemberRow[]>(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const inviteReady =
    email.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0;

  // Esc closes the drawer
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const target = email.trim();
    if (!inviteReady) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    startTransition(async () => {
      const res = await inviteMember(target, role, fullName);
      if (res.ok) {
        setMsg({ kind: "ok", text: `Invite sent to ${target}.` });
        setEmail(""); setFirstName(""); setLastName(""); setRole("member");
        setDrawerOpen(false);
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  function doRemoveMember(userId: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await removeMember(userId);
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        setConfirmRemove(null);
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  function onSelectRole(userId: string, originalRole: string, value: "admin" | "member") {
    setEditedRoles((prev) => {
      const nextMap = { ...prev };
      if (value === originalRole) delete nextMap[userId];
      else nextMap[userId] = value;
      return nextMap;
    });
  }

  function saveRole(userId: string) {
    const next = editedRoles[userId];
    if (!next) return;
    setMsg(null);
    startTransition(async () => {
      const res = await setMemberRole(userId, next);
      if (res.ok) {
        setEditedRoles((prev) => {
          const map = { ...prev };
          delete map[userId];
          return map;
        });
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: next } : m)));
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <div className="col-span-2">
      <div className="flex items-start justify-between gap-3">
        
        <button
          type="button"
          onClick={() => { setDrawerOpen(true); setMsg(null); }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white"
        >
          <IconPlus size={14} stroke={2} />
          Invite Member
        </button>
      </div>

      {msg && !drawerOpen && (
        <div className={cn("mt-3 text-[12px]", msg.kind === "ok" ? "text-success" : "text-danger")}>
          {msg.text}
        </div>
      )}

      <div className="mt-5">
        {members.map((m) => {
          const isSelf = m.id === currentUserId;
          const editedRole = editedRoles[m.id];
          const roleDirty = editedRole !== undefined;
          const roleValue = editedRole ?? m.role;
          const isPending = m.pending;
          const meta = [
            m.email,
            isSelf ? "You" : null,
            isPending ? "Invite pending" : null,
          ].filter(Boolean).join(" · ");
          return (
            <div key={m.id} className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
              <div
                className="flex-shrink-0 inline-flex items-center justify-center rounded-full text-white text-[12px] font-semibold"
                style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
                }}
              >
                {initials(m.full_name || m.email || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-ink">{m.full_name || m.email}</div>
                {meta && <div className="text-[12px] text-gray-500 mt-0.5 truncate">{meta}</div>}
              </div>

              {/* Role tab / inline editor */}
              {!isSelf && !isPending ? (
                <div className="flex items-center gap-2">
                  {roleDirty ? (
                    <>
                      <select
                        value={roleValue}
                        onChange={(e) => onSelectRole(m.id, m.role, e.target.value as "admin" | "member")}
                        className={`${inputClass} cursor-pointer`}
                        style={{ width: 110 }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => saveRole(m.id)}
                        disabled={pending}
                        className="rounded-md btn-primary px-2.5 py-[5px] text-[12px] font-medium text-white"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectRole(m.id, m.role, m.role === "admin" ? "member" : "admin")}
                      title="Click to change role"
                      className={cn(
                        "role-tab cursor-pointer",
                        m.role === "admin" ? "role-tab-admin" : "role-tab-member"
                      )}
                    >
                      {m.role === "admin" ? "ADMIN" : "MEMBER"}
                    </button>
                  )}
                </div>
              ) : isPending ? (
                <span className="role-tab role-tab-pending">PENDING</span>
              ) : (
                <span className={cn("role-tab", m.role === "admin" ? "role-tab-admin" : "role-tab-member")}>
                  {m.role === "admin" ? "ADMIN" : "MEMBER"}
                </span>
              )}

              {/* Remove */}
              {!isSelf && (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(m.id)}
                  className="ml-2 text-gray-400 hover:text-danger"
                  aria-label="Remove"
                >
                  <IconTrash size={14} stroke={1.75} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm remove modal — kept inline as a small overlay */}
      {confirmRemove && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="w-[420px] rounded-lg border border-gray-200 bg-surface p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-semibold text-ink">Remove this member?</div>
            <div className="mt-1 text-[12.5px] text-gray-500">
              They lose access immediately. Anything they own (leads, tasks, notes) stays on record.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12.5px] text-ink hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => doRemoveMember(confirmRemove)}
                disabled={pending}
                className="rounded-md bg-danger px-3 py-[6px] text-[12.5px] font-medium text-white hover:bg-danger-strong"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite drawer */}
      <div
        className={cn("drawer-backdrop", drawerOpen && "open")}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={cn("drawer-panel", drawerOpen && "open")} aria-hidden={!drawerOpen}>
        <header className="drawer-head">
          <div>
            <div className="drawer-eyebrow">Invite Member</div>
            <h2 className="drawer-title">New Team Member</h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </header>

        <form onSubmit={sendInvite} className="drawer-body">
          <div className="drawer-field">
            <label className="drawer-label">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="Jordan"
              autoFocus
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="Lee"
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="jordan@yourdomain.com"
            />
          </div>

          <div className="drawer-field">
            <label className="drawer-label">Role</label>
            <div className="flex flex-col gap-2">
              <label className={cn(
                "flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors",
                role === "admin" ? "border-ink bg-gray-50" : "border-gray-200 hover:border-gray-300"
              )}>
                <input
                  type="radio"
                  name="invite-role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                  className="mt-1"
                />
                <div>
                  <div className="text-[13px] font-semibold text-ink">Admin</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    Full access. Manage settings, invite teammates, delete records.
                  </div>
                </div>
              </label>
              <label className={cn(
                "flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors",
                role === "member" ? "border-ink bg-gray-50" : "border-gray-200 hover:border-gray-300"
              )}>
                <input
                  type="radio"
                  name="invite-role"
                  value="member"
                  checked={role === "member"}
                  onChange={() => setRole("member")}
                  className="mt-1"
                />
                <div>
                  <div className="text-[13px] font-semibold text-ink">Member</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    Standard access. View and edit leads, tasks, contacts, documents, imports.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {msg && (
            <div className={cn("text-[12px]", msg.kind === "ok" ? "text-success" : "text-danger")}>
              {msg.text}
            </div>
          )}
        </form>

        <footer className="drawer-foot">
          <span className="text-[11.5px] text-gray-400">Invite expires in 7 days.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12.5px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => sendInvite(e as unknown as React.FormEvent)}
              disabled={!inviteReady || pending}
              className="rounded-md btn-primary px-3 py-[6px] text-[12.5px] font-medium text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
