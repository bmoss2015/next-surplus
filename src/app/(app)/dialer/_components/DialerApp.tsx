"use client";

import { useMemo, useState } from "react";
import { DIALER_LEADS, type DialerLead, firstDialable, dialableNumberCount } from "../_mock/data";
import { QueueBuilder } from "./QueueBuilder";
import { ActiveCall } from "./ActiveCall";

export type QueueEntry = {
  leadId: string;
  contactId: string;
  numberId: string;
};

export type View =
  | { kind: "builder" }
  | { kind: "calling"; queue: QueueEntry[]; index: number; callerIdId: string };

export function DialerApp() {
  const [view, setView] = useState<View>({ kind: "builder" });

  const lookup = useMemo(() => {
    const m = new Map<string, DialerLead>();
    for (const lead of DIALER_LEADS) m.set(lead.id, lead);
    return m;
  }, []);

  function startDialing(leadIds: string[], callerIdId: string) {
    const queue: QueueEntry[] = [];
    for (const id of leadIds) {
      const lead = lookup.get(id);
      if (!lead) continue;
      const first = firstDialable(lead);
      if (!first) continue;
      queue.push({
        leadId: lead.id,
        contactId: first.contact.id,
        numberId: first.num.id,
      });
    }
    if (queue.length === 0) return;
    setView({ kind: "calling", queue, index: 0, callerIdId });
  }

  function advance() {
    if (view.kind !== "calling") return;
    const nextIndex = view.index + 1;
    if (nextIndex >= view.queue.length) {
      setView({ kind: "builder" });
      return;
    }
    setView({ ...view, index: nextIndex });
  }

  function stop() {
    setView({ kind: "builder" });
  }

  if (view.kind === "calling") {
    const entry = view.queue[view.index];
    const lead = lookup.get(entry.leadId);
    if (!lead) {
      setView({ kind: "builder" });
      return null;
    }
    return (
      <ActiveCall
        key={`${entry.leadId}-${entry.contactId}-${entry.numberId}`}
        lead={lead}
        contactId={entry.contactId}
        numberId={entry.numberId}
        callerIdId={view.callerIdId}
        position={view.index + 1}
        total={view.queue.length}
        onNext={advance}
        onStop={stop}
        onChangeCallerId={(id) => setView({ ...view, callerIdId: id })}
      />
    );
  }

  return (
    <QueueBuilder
      leads={DIALER_LEADS}
      dialableNumberCount={dialableNumberCount}
      onStart={startDialing}
    />
  );
}
