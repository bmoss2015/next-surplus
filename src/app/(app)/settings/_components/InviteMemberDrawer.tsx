"use client";

// Settings clone · Phase D.2 — Invite Member drawer.
//
// Wraps the shared Drawer with the invite form: full name, email, and the
// role-choice radio cards (Admin vs Member, with the "what each can do"
// copy from the mockup). Calls inviteMember; on success, refreshes the
// page so the new pending row shows up in the roster.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import { inviteMember } from "@/app/(app)/settings/_actions";

export function InviteMemberDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      // Reset the invite form each time the drawer opens.
      /* eslint-disable react-hooks/set-state-in-effect */
      setFullName("");
      setEmail("");
      setRole("member");
      setErrMsg(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const ready =
    fullName.trim().length > 0 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  function onInvite() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await inviteMember(email.trim(), role, fullName.trim());
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Invite"
      title="Invite Member"
      footer={
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!ready || pending}
              onClick={onInvite}
            >
              {pending ? "Sending…" : "Send Invite"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            {errMsg && (
              <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
                {errMsg}
              </span>
            )}
          </div>
        </>
      }
    >
      <div className="drawer-field">
        <label className="drawer-label">Full Name</label>
        <input
          className="input"
          style={{ width: "100%" }}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          autoFocus
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Email</label>
        <input
          className="input"
          type="email"
          style={{ width: "100%" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@yourdomain.com"
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Role</label>
        <div className="role-choice">
          <RoleCard
            value="admin"
            checked={role === "admin"}
            onSelect={() => setRole("admin")}
            title="Admin"
            desc="Full access. Can manage settings, invite teammates, delete records, and view billing."
          />
          <RoleCard
            value="member"
            checked={role === "member"}
            onSelect={() => setRole("member")}
            title="Member"
            desc="Views and edits leads, tasks, contacts, documents, and imports. Can't change settings or remove records."
          />
        </div>
      </div>
    </Drawer>
  );
}

function RoleCard({
  value,
  checked,
  onSelect,
  title,
  desc,
}: {
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={"role-choice-card" + (checked ? " selected" : "")}
      onClick={onSelect}
    >
      <input
        type="radio"
        name="invite-role"
        value={value}
        checked={checked}
        onChange={onSelect}
      />
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45 }}>
          {desc}
        </div>
      </div>
    </label>
  );
}
