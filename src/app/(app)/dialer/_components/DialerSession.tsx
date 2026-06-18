"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconPhone, IconPlayerSkipForward } from "@tabler/icons-react";
import { DialerHeader } from "./DialerHeader";
import { QueuePanel } from "./QueuePanel";
import { CallHero } from "./CallHero";
import { LeadDataPanel } from "./LeadDataPanel";
import { ActivityTimelinePanel } from "./ActivityTimelinePanel";
import { FollowUpToast } from "./FollowUpToast";
import { getQueueLeads, type CallOutcome } from "../_mock-data";

type CallState = "live" | "wrapup";

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
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [skipFollowUp, setSkipFollowUp] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);

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
    setSelectedOutcome(null);
    setQuickNote("");
    setSkipFollowUp(false);
    setCountdown(null);
  }, [activeLead, contactIndex, queue]);

  useEffect(() => {
    if (state !== "wrapup" || !selectedOutcome || noteFocused) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = 3 - elapsed;
      if (remaining <= 0) {
        clearInterval(tick);
        advance();
        return;
      }
      setCountdown(remaining);
    }, 200);
    return () => clearInterval(tick);
  }, [state, selectedOutcome, noteFocused, advance]);

  function endCall() {
    setState("wrapup");
  }

  function pickOutcome(o: CallOutcome) {
    setSelectedOutcome(o);
    setCountdown(3);
    if (!skipFollowUp && (o === "Interested" || o === "Callback Requested")) {
      setToastVisible(true);
    }
  }

  function skipCountdown() {
    setCountdown(null);
    advance();
  }

  function selectLead(id: string) {
    setActiveLeadId(id);
    setContactIndex(0);
    setState("live");
    setSelectedOutcome(null);
    setQuickNote("");
    setCountdown(null);
  }

  const nextContactPreview = (() => {
    const next = activeLead.contacts[contactIndex + 1];
    if (next) return next;
    const idx = queue.findIndex((l) => l.id === activeLead.id);
    const nl = queue.slice(idx + 1).find((l) => !l.completed);
    return nl ? nl.contacts[0] : null;
  })();

  return (
    <div className="flex h-full flex-col bg-canvas">
      <DialerHeader
        onPause={() => setPaused((p) => !p)}
        onEnd={() => { /* end session */ }}
        paused={paused}
      />

      {state === "wrapup" && selectedOutcome && countdown !== null && nextContactPreview && (
        <div
          className="sticky top-0 z-30 flex h-11 items-center justify-between px-6 text-[13px] text-white"
          style={{
            background: "linear-gradient(90deg, #04261c 0%, #0d4b3a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold">Next</span>
            <span className="text-white/85">
              {nextContactPreview.name} · {nextContactPreview.relationship}
            </span>
            <span className="tabular-nums text-white/85">
              0:{String(countdown).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={skipCountdown}
              className="flex h-7 items-center gap-1 rounded-md bg-white px-3 text-[12px] font-semibold text-petrol-500 transition hover:bg-gray-100"
            >
              <IconPhone size={13} stroke={2.25} />
              Dial Now
            </button>
            <button
              type="button"
              onClick={advance}
              className="flex h-7 items-center gap-1 rounded-md bg-[rgba(255,255,255,0.12)] px-3 text-[12px] font-semibold text-white transition hover:bg-[rgba(255,255,255,0.22)]"
            >
              <IconPlayerSkipForward size={13} stroke={2.25} />
              Skip
            </button>
          </div>
        </div>
      )}

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
            skipFollowUp={skipFollowUp}
            setSkipFollowUp={setSkipFollowUp}
            onNoteFocusChange={setNoteFocused}
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
