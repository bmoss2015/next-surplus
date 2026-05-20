"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "../_actions";
import { useSavePill } from "@/components/SavePillProvider";

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "")) {
    return { first: "", last: "" };
  }
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0).toUpperCase();
  const b = last.trim().charAt(0).toUpperCase();
  return (a + b) || "?";
}

// Settings redesign — minimal hero + pref-row pattern.
// Wired to the existing updateMyProfile action (fullName + email). Time Zone
// + avatar upload land in a follow-up once migration 0115 is applied to
// staging and the action accepts the new columns.
export function ProfileSection({
  initialFullName,
  initialEmail,
  isAdmin = false,
}: {
  initialFullName: string;
  initialEmail: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const seed = splitName(initialFullName);
  const [firstName, setFirstName] = useState(seed.first);
  const [lastName, setLastName] = useState(seed.last);
  const [email, setEmail] = useState(initialEmail);

  const ready =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0;
  const dirty =
    `${firstName.trim()} ${lastName.trim()}`.trim() !== initialFullName.trim() ||
    email.trim().toLowerCase() !== (initialEmail ?? "").toLowerCase();

  useSavePill({
    key: "profile",
    dirty: dirty && ready,
    save: async () => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const res = await updateMyProfile(fullName, email.trim());
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    },
    discard: () => {
      setFirstName(seed.first);
      setLastName(seed.last);
      setEmail(initialEmail);
    },
  });

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Profile</h2>

      <div className="clean-hero">
        <div className="clean-hero-avatar">{initials(firstName, lastName)}</div>
        <div className="min-w-0 flex-1">
          <div className="clean-hero-title">
            {firstName} {lastName}
          </div>
          <div className="clean-hero-meta">
            {email} · {isAdmin ? "Admin" : "Member"}
          </div>
        </div>
        <button
          type="button"
          className="clean-hero-upload rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[12.5px] font-medium text-ink hover:border-gray-300"
          title="Coming soon"
          disabled
        >
          Upload Photo
        </button>
      </div>

      <div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">First Name</div>
          </div>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Last Name</div>
          </div>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Email</div>
            <div className="pref-row-desc">
              Used for sign-in and mention notifications.
            </div>
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Time Zone</div>
            <div className="pref-row-desc">
              Used for due-date display and daily digest delivery time.
            </div>
          </div>
          <select
            className={`pref-row-input ${inputClass} cursor-pointer`}
            defaultValue="America/Chicago"
            disabled
            title="Saves once the next migration applies to staging."
          >
            <option value="America/Chicago">(GMT-06:00) Central — Chicago</option>
            <option value="America/New_York">(GMT-05:00) Eastern — New York</option>
            <option value="America/Denver">(GMT-07:00) Mountain — Denver</option>
            <option value="America/Los_Angeles">(GMT-08:00) Pacific — Los Angeles</option>
          </select>
        </div>

      </div>
    </div>
  );
}
