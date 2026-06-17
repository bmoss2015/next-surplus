"use client";

import {
  IconMicrophone,
  IconMicrophoneOff,
  IconHandStop,
  IconArrowsTransferUp,
  IconNote,
  IconPhoneOff,
  IconNumber,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { CallOutcome, DialerLead } from "../_mock-data";

type CallState = "live" | "wrapup";

const OUTCOMES: CallOutcome[] = [
  "Interested",
  "Callback Requested",
  "Not Interested",
  "Wrong Number",
  "Do Not Contact",
];

export function CallHero({
  lead,
  contactIndex,
  totalContacts,
  state,
  onEndCall,
  onOutcome,
  selectedOutcome,
  quickNote,
  setQuickNote,
  skipFollowUp,
  setSkipFollowUp,
}: {
  lead: DialerLead;
  contactIndex: number;
  totalContacts: number;
  state: CallState;
  onEndCall: () => void;
  onOutcome: (o: CallOutcome) => void;
  selectedOutcome: CallOutcome | null;
  quickNote: string;
  setQuickNote: (s: string) => void;
  skipFollowUp: boolean;
  setSkipFollowUp: (b: boolean) => void;
}) {
  const [elapsed, setElapsed] = useState(272);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state !== "live") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state]);

  const contact = lead.contacts[contactIndex] ?? lead.contacts[0];
  const recoveryDollars = lead.surplus * (lead.recoveryFeePct / 100);
  const netToFirm = recoveryDollars - lead.attorneyCost;

  const fmt = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <section
      className="relative flex flex-1 flex-col overflow-hidden p-8 text-white"
      style={{
        background:
          "linear-gradient(135deg, #04261c 0%, #0d4b3a 70%, #13644e 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-white/70">
            Contact {contactIndex + 1} of {totalContacts}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={[
                "h-2 w-2 rounded-full",
                state === "live" ? "bg-[#34d399]" : "bg-gray-300/70",
              ].join(" ")}
              style={
                state === "live"
                  ? { boxShadow: "0 0 0 4px rgba(52, 211, 153, 0.20)" }
                  : undefined
              }
            />
            <span className="text-[12.5px] text-white/85 tabular-nums">
              {state === "live"
                ? `Connected ${fmt(elapsed)}`
                : `Call Ended ${fmt(elapsed)}`}
            </span>
          </div>

          <h1 className="mt-5 text-[34px] font-semibold leading-[1.1] tracking-tight">
            {contact.name}
          </h1>
          <div className="mt-1.5 text-[15px] text-white/85">
            {contact.relationship}
          </div>
          <div
            className="mt-1 text-[15px] text-white/85 tabular-nums"
            style={{ whiteSpace: "nowrap" }}
          >
            {contact.phone}
          </div>
          <div
            className="mt-1 text-[14px] text-white/75"
            style={{ wordSpacing: "0.02em" }}
          >
            {contact.address.split(",").map((part, i, arr) => (
              <span key={i}>
                {part.trim()}
                {i < arr.length - 1 ? ", " : ""}
                {i < arr.length - 1 && <wbr />}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 space-y-2 pt-1">
          <FinancialRow label="Recovery Fee" value={`${lead.recoveryFeePct}%`} />
          <FinancialRow
            label="Surplus"
            value={`$${lead.surplus.toLocaleString()}`}
          />
          <FinancialRow
            label="Net to Firm"
            value={`$${Math.round(netToFirm).toLocaleString()}`}
          />
        </div>
      </div>

      <div
        className="my-7 h-px w-full"
        style={{ background: "rgba(255,255,255,0.20)" }}
      />

      <div
        className={[
          "transition-opacity",
          state === "wrapup" ? "opacity-70" : "opacity-100",
        ].join(" ")}
      >
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.10em] text-white/70">
          Lead Summary
        </div>
        <ul className="mt-3 space-y-2">
          {lead.summary.map((s, i) => (
            <li
              key={i}
              className="relative pl-4 text-[13.5px] leading-relaxed text-white/95"
            >
              <span
                aria-hidden
                className="absolute left-0 top-[9px] h-1 w-1 rounded-full bg-white/70"
              />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-6">
        {state === "live" ? (
          <div className="flex items-end justify-between">
            <div className="flex gap-2">
              <ControlButton icon={IconMicrophone} label="Mute" />
              <ControlButton icon={IconNumber} label="Keypad" />
              <ControlButton icon={IconHandStop} label="Hold" />
              <ControlButton icon={IconArrowsTransferUp} label="Transfer" />
              <ControlButton icon={IconNote} label="Add Note" />
            </div>
            <button
              type="button"
              onClick={onEndCall}
              className="flex h-11 w-[110px] items-center justify-center gap-1.5 rounded-lg bg-[#b91c1c] text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.20)] transition hover:bg-[#a01818]"
            >
              <IconPhoneOff size={15} stroke={2.25} />
              End Call
            </button>
          </div>
        ) : (
          <div>
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.10em] text-white/70">
              Call Outcome
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {OUTCOMES.map((o) => {
                const sel = selectedOutcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOutcome(o)}
                    className={[
                      "h-11 rounded-lg text-[12.5px] font-medium transition",
                      sel
                        ? "bg-white text-petrol-500"
                        : "bg-[rgba(4,38,28,0.55)] text-white hover:bg-[rgba(4,38,28,0.40)]",
                    ].join(" ")}
                  >
                    {o}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <input
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Quick note (optional)"
                className="w-full border-0 border-b border-white/40 bg-transparent pb-1.5 text-[13.5px] text-white placeholder:text-white/55 outline-none focus:border-white"
              />
            </div>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-white/85">
              <input
                type="checkbox"
                checked={skipFollowUp}
                onChange={(e) => setSkipFollowUp(e.target.checked)}
                className="h-3.5 w-3.5 accent-white"
              />
              Skip follow up this call
            </label>
          </div>
        )}
      </div>
    </section>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[16px] text-white/85">{label}</span>
      <span className="text-[16px] font-semibold tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-11 w-[110px] flex-col items-center justify-center gap-0.5 rounded-lg text-white transition hover:bg-[rgba(4,38,28,0.40)]"
      style={{ background: "rgba(4,38,28,0.55)" }}
    >
      <Icon size={15} stroke={2} />
      <span className="text-[11.5px] font-medium leading-none">{label}</span>
    </button>
  );
}
