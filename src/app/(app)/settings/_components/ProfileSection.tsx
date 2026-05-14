"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "../_actions";

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "")) {
    return { first: "", last: "" };
  }
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function ProfileSection({
  initialFullName,
  initialEmail,
}: {
  initialFullName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const seed = splitName(initialFullName);
  const [firstName, setFirstName] = useState(seed.first);
  const [lastName, setLastName] = useState(seed.last);
  const [email, setEmail] = useState(initialEmail);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const ready =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0;
  const dirty =
    `${firstName.trim()} ${lastName.trim()}`.trim() !== initialFullName.trim() ||
    email.trim().toLowerCase() !== (initialEmail ?? "").toLowerCase();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!ready) {
      setMsg({ kind: "err", text: "Name and email are required." });
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    startTransition(async () => {
      const res = await updateMyProfile(fullName, email.trim());
      if (res.ok) {
        setMsg({ kind: "ok", text: "Profile updated." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h2 className="section-subheader">My Profile</h2>
        <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
          Update the name and email that show on your team card, mention
          notifications, and audit log entries.
        </div>
      </div>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500">
              First Name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500">
              Last Name
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        {msg && (
          <div
            className={`text-[12px] ${
              msg.kind === "ok" ? "text-success" : "text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={pending || !ready || !dirty}
            className="cursor-pointer rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
