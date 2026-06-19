"use client";

import { useEffect, useState } from "react";
import { AutomationsSubRail } from "./AutomationsSubRail";
import { WebFormPanel } from "./WebFormPanel";
import type { WebFormRow } from "../page";
import type { OrgMemberRow } from "@/lib/settings/fetch";
import type { OrgStage } from "@/lib/stages/types";

export function AutomationsShell({
  form,
  members,
  stages,
}: {
  form: WebFormRow | null;
  members: OrgMemberRow[];
  stages: OrgStage[];
}) {
  const [active, setActive] = useState<string>("web-form");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h) setActive(h);
  }, []);

  function select(key: string) {
    setActive(key);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${key}`);
    }
  }

  return (
    <div className="flex h-full">
      <AutomationsSubRail active={active} onSelect={select} />
      <main className="flex-1 overflow-y-auto bg-[#fafafa] px-8 py-6">
        <div className="mx-auto max-w-[720px]">
          {active === "web-form" && (
            <WebFormPanel form={form} members={members} stages={stages} />
          )}
        </div>
      </main>
    </div>
  );
}
