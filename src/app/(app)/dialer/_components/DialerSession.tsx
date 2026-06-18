"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DialerHeader } from "./DialerHeader";
import { QueuePanel } from "./QueuePanel";
import { CallHero } from "./CallHero";
import { LeadDataPanel } from "./LeadDataPanel";
import { ActivityTimelinePanel } from "./ActivityTimelinePanel";
import { FollowUpToast } from "./FollowUpToast";
import { getQueueLeads, type CallOutcome } from "../_mock-data";

type CallState = "live" | "wrapup";

const WRAP_UP_DEFAULT = 30;

export function DialerSession() {
  const queue = useMemo(() => getQueueLeads(), []);
  const [activeLeadId, setActiveLeadId] = useState(
    queue.find((l) => !l.completed)?.id ?? queue[0].id,
  );
  const [contactIndex, setContactIndex] = useState(0);
  const [state, setState] = useState<CallState>("live");
  const [paused, setPaused] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>("Connected");
  const [quickNote, setQuickNote] = useState("");
  const [countdown, setCountdown] = useState<number>(WRAP_UP_DEFAULT);

  const activeLead = queue.find((l) => l.id === activeLeadId) ?? queue[0];

  const advance = useCallback(() => {
    const nextContact = activeLead.contacts[contactIndex + 1];
    if (nextContact) {
      setContactIndex((i) => i + 1);
    } else {
      const idx = queue.findIndex((l) => l.id === activeLead.id);
      const next = queue.slice(idx + 1).find((l) => !l.completed);
      if (next) {
        setActiveLeadId(next.id);
        setContactIndex(0);
      }
    }
    setState("live");
    setSelectedOutcome("Connected");
    setQuickNote("");
    setCountdown(WRAP_UP_DEFAULT);
  }, [activeLead, contactIndex, queue]);

  const skipLead = useCallback(() => {
    const idx = queue.findIndex((l) => l.id === activeLead.id);
    const next = queue.slice(idx + 1).find((l) => !l.completed);
    if (next) {
      setActiveLeadId(next.id);
      setContactIndex(0);
      setState("live");
      setSelectedOutcome("Connected");
      setQuickNote("");
      setCountdown(WRAP_UP_DEFAULT);
    }
  }, [activeLead, queue]);

  useEffect(() => {
    if (state !== "wrapup" || selectedOutcome !== "Connected" || paused) return;
    const start = Date.now();
    const startFrom = countdown;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = startFrom - elapsed;
      if (remaining <= 0) {
        clearInterval(tick);
        setToastVisible(true);
        advance();
        return;
      }
      setCountdown(remaining);
    }, 250);
    return () => clearInterval(tick);
    // countdown intentionally read once as the start value, not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, selectedOutcome, paused, advance]);

  function endCall() {
    setState("wrapup");
    setSelectedOutcome("Connected");
    setCountdown(WRAP_UP_DEFAULT);
  }

  function pickOutcome(o: CallOutcome) {
    setSelectedOutcome(o);
    if (o !== "Connected") {
      advance();
    }
  }

  function nextLead() {
    if (selectedOutcome === "Connected") {
      setToastVisible(true);
    }
    advance();
  }

  function selectLead(id: string) {
    setActiveLeadId(id);
    setContactIndex(0);
    setState("live");
    setSelectedOutcome("Connected");
    setQuickNote("");
    setCountdown(WRAP_UP_DEFAULT);
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <DialerHeader
        onPause={() => setPaused((p) => !p)}
        onEnd={() => { /* end session */ }}
        paused={paused}
      />

      <div className="flex flex-1 items-stretch overflow-hidden px-6 py-6">
        <div
          className="flex w-full overflow-hidden rounded-2xl bg-white"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.12)",
          }}
        >
          <QueuePanel
            leads={queue}
            activeLeadId={activeLeadId}
            onSelect={selectLead}
          />
          <CallHero
            lead={activeLead}
            contactIndex={contactIndex}
            totalContacts={activeLead.contacts.length}
            state={state}
            onEndCall={endCall}
            onOutcome={pickOutcome}
            selectedOutcome={selectedOutcome}
            quickNote={quickNote}
            setQuickNote={setQuickNote}
            countdown={countdown}
            onNextLead={nextLead}
            onSkipLead={skipLead}
            paused={paused}
          />
          <div className="relative w-[340px] shrink-0">
            <LeadDataPanel
              lead={activeLead}
              onOpenTimeline={() => setTimelineOpen(true)}
            />
            <ActivityTimelinePanel
              open={timelineOpen}
              lead={activeLead}
              onClose={() => setTimelineOpen(false)}
            />
          </div>
        </div>
      </div>

      <FollowUpToast
        visible={toastVisible}
        onUndo={() => setToastVisible(false)}
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
}
