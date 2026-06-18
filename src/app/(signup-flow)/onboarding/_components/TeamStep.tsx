"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "./StepShell";
import { inviteTeammates } from "../_actions";
import { InlineError } from "@/components/InlineError";

export function TeamStep() {
  const router = useRouter();
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function landInApp() {
    const host =
      typeof window !== "undefined" ? window.location.host : "";
    if (host === "nextsurplus.com" || host === "www.nextsurplus.com") {
      window.location.assign("https://app.nextsurplus.com/");
    } else {
      router.push("/");
    }
  }

  function next() {
    setError(null);
    const list = emails
      .split(/[,\n\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (list.length === 0) {
      landInApp();
      return;
    }

    startTransition(async () => {
      const result = await inviteTeammates({ emails: list });
      if (result.ok) {
        landInApp();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <StepShell
      step="team"
      title="Invite Your Team"
      subtitle="Send invites so your team can pick up where you left off. You can add more anytime in Settings."
      primaryLabel={emails.trim() ? "Send Invites" : "Finish"}
      onPrimary={next}
      primaryPending={pending}
      skipHref="https://app.nextsurplus.com/"
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11.5px] font-medium text-[#374151]">
          Teammate Emails
        </label>
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="ana@firm.com, jordan@firm.com"
          rows={4}
          className="w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 py-2.5 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
        />
        <p className="text-[11px] text-[#9ca3af]">
          Separate with commas or new lines. Each teammate gets an email with a
          link to join your workspace.
        </p>
      </div>

      <InlineError message={error} />
    </StepShell>
  );
}
