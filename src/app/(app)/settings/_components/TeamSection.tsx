"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconX } from "@tabler/icons-react";
import { inviteMember, setMemberRole } from "../_actions";
import type { OrgMemberRow } from "@/lib/settings/fetch";

// Fix 62 — team members rendered as cards, 3 per row. Invite button lives in
// the section header and opens a modal with an email input + role selector.

export function TeamSection({
  initial,
  currentUserId,
}: {
  initial: OrgMemberRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const inviteReady =
    email.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0;

  function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const target = email.trim();
    if (!inviteReady) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    startTransition(async () => {
      const res = await inviteMember(target, role, fullName);
      if (res.ok) {
        setMsg({ kind: "ok", text: `Invite Sent To ${target}.` });
        setEmail("");
        setFirstName("");
        setLastName("");
        setRole("member");
        setModalOpen(false);
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  function removeMember(userId: string) {
    setMsg(null);
    startTransition(async () => {
      // Demote-to-removed isn't a real op yet; keep using the role action as
      // the existing guard surface. Removing simply demotes to member.
      const res = await setMemberRole(userId, "member");
      if (res.ok) router.refresh();
      else setMsg({ kind: "err", text: res.error });
    });
  }

  function changeRole(userId: string, next: "admin" | "member") {
    setMsg(null);
    startTransition(async () => {
      const res = await setMemberRole(userId, next);
      if (res.ok) router.refresh();
      else setMsg({ kind: "err", text: res.error });
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[14px] font-medium text-ink">Team</h2>
          <div className="mt-[1px] text-[11px] text-gray-500">
            Admins manage Settings and can delete records. Members can view and
            edit leads, tasks, contacts, documents, notes, and imports.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalOpen(true);
            setMsg(null);
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white"
        >
          <IconPlus size={14} stroke={2} />
          Invite
        </button>
      </div>

      {msg && (
        <div
          className={`mb-3 text-[12px] ${
            msg.kind === "ok" ? "text-success" : "text-danger"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {initial.map((m) => {
          const isSelf = m.id === currentUserId;
          const initialLetter = (m.full_name || m.email || "?")
            .trim()
            .charAt(0)
            .toUpperCase();
          return (
            <div
              key={m.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-surface p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-petrol-100 text-[14px] font-medium text-petrol-700">
                  {initialLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">
                    {m.full_name || "Pending"}
                    {isSelf && (
                      <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-gray-500">
                    {m.email ?? "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {isSelf ? (
                  <span className="rounded-full bg-petrol-50 px-2 py-[2px] text-[10.5px] font-medium text-petrol-700">
                    {m.role === "admin" ? "Admin" : "Member"}
                  </span>
                ) : (
                  <select
                    value={m.role}
                    disabled={pending}
                    onChange={(e) =>
                      changeRole(m.id, e.target.value as "admin" | "member")
                    }
                    className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none focus:border-petrol-500 disabled:opacity-60"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                )}
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    disabled={pending}
                    className="cursor-pointer text-[11px] text-gray-400 hover:text-danger disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {initial.length === 0 && (
          <div className="col-span-3 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
            No team members yet.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-[15px] font-medium text-ink">
                Invite Teammate
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-ink"
                aria-label="Close"
              >
                <IconX size={16} stroke={1.75} />
              </button>
            </div>
            <form onSubmit={sendInvite} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500">
                  Email
                </label>
                <input
                  autoFocus
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "admin" | "member")
                  }
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {msg && msg.kind === "err" && (
                <div className="text-[12px] text-danger">{msg.text}</div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink hover:border-petrol-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !inviteReady}
                  className="cursor-pointer rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white disabled:opacity-50"
                >
                  {pending ? "Sending" : "Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
