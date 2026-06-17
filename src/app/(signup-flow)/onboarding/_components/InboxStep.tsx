"use client";

import { useRouter } from "next/navigation";
import { StepShell } from "./StepShell";

export function InboxStep() {
  const router = useRouter();

  function next() {
    router.push("/onboarding/team");
  }

  function connectGmail() {
    window.location.assign("/api/oauth/google/start?next=/onboarding/team");
  }

  function connectOutlook() {
    window.location.assign("/api/oauth/outlook/start?next=/onboarding/team");
  }

  function connectImap() {
    window.location.assign("/settings?panel=email-integration");
  }

  return (
    <StepShell
      step="inbox"
      title="Connect Your Inbox"
      subtitle="Bring your owner email threads into Next Surplus. Pick one to start. You can connect the others anytime in Settings."
      primaryLabel="Continue"
      onPrimary={next}
      skipHref="/onboarding/team"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ProviderCard
          name="Gmail"
          sub="Google Workspace or Gmail.com"
          onClick={connectGmail}
        />
        <ProviderCard
          name="Outlook"
          sub="Microsoft 365 or Outlook.com"
          onClick={connectOutlook}
        />
        <ProviderCard
          name="IMAP"
          sub="Any IMAP and SMTP server"
          onClick={connectImap}
        />
      </div>

      <div className="mt-6 rounded-[6px] border border-[#e5e7eb] bg-[#fafbfc] px-4 py-3 text-[11.5px] leading-relaxed text-[#374151]">
        Google may show an "unverified app" warning the first time you connect.
        That is expected during our verification review. The connection is
        end to end encrypted and only reads owner threads you label.
      </div>
    </StepShell>
  );
}

function ProviderCard({
  name,
  sub,
  onClick,
}: {
  name: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 rounded-[8px] border border-[#e5e7eb] bg-white p-4 text-left hover:border-[#04261c]"
    >
      <div className="text-[13.5px] font-semibold text-[#04261c]">{name}</div>
      <div className="text-[11.5px] text-[#6b7280]">{sub}</div>
      <div className="mt-3 text-[11px] font-medium text-[#13644e]">
        Connect &rarr;
      </div>
    </button>
  );
}
