"use client";

// Power Dialer org defaults: Recording, AMD, Transcription toggles.
// Admin only via parent panel gate. Operators can override these per
// session in the Setup Wizard's Customize For This Session panel.

import { useState, useTransition } from "react";
import {
  IconMicrophone,
  IconPhoneCall,
  IconFileText,
} from "@tabler/icons-react";
import type { DialerDefaults } from "@/lib/settings/fetch";
import { updateDialerDefaults } from "../_actions";

export function DialerDefaultsSection({ initial }: { initial: DialerDefaults }) {
  const [recording, setRecording] = useState(initial.call_recording_enabled);
  const [amd, setAmd] = useState(initial.amd_enabled);
  const [transcript, setTranscript] = useState(initial.transcription_enabled);
  const [wrapUp, setWrapUp] = useState(initial.wrap_up_seconds);
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(patch: Partial<Parameters<typeof updateDialerDefaults>[0]>) {
    setError(null);
    setSaved(false);
    startSave(async () => {
      const res = await updateDialerDefaults(patch);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <div className="mx-auto w-full max-w-[840px] px-8 pb-32 pt-10">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">Dialer Defaults</h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-[#5b606a]">
          Org-wide settings for every dialer session. Operators can override these for a single session from Customize For This Session in the Setup Wizard. Persistent changes are admin only.
        </p>
      </div>

      <SectionCard
        eyebrow="Telephony Add-Ons"
        title="Recording, Detection, Transcription"
        intro="Each toggle controls a call-time add-on. Usage is included in the monthly subscription up to fair-use limits."
      >
        <ToggleRow
          icon={<IconMicrophone size={14} stroke={2.25} />}
          label="Call Recording"
          subtitle="Saves an audio file of every connected call to the lead's activity timeline."
          on={recording}
          onChange={(v) => { setRecording(v); save({ call_recording_enabled: v }); }}
        />
        <ToggleRow
          icon={<IconPhoneCall size={14} stroke={2.25} />}
          label="Answering Machine Detection"
          subtitle="Detects when a voicemail picks up so the dialer can skip or play a voicemail drop instead of ringing dead air."
          on={amd}
          onChange={(v) => { setAmd(v); save({ amd_enabled: v }); }}
        />
        <ToggleRow
          icon={<IconFileText size={14} stroke={2.25} />}
          label="Live Call Transcription"
          subtitle="Generates a searchable text transcript of every recorded call. Visible on the lead detail page."
          on={transcript}
          onChange={(v) => { setTranscript(v); save({ transcription_enabled: v }); }}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Session Behavior"
        title="Wrap Up Time"
        intro="Pause after a connected call so notes can be finished before the next number rings."
      >
        <div className="px-7 py-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Seconds Between Calls</div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={wrapUp}
              onChange={(e) => setWrapUp(parseInt(e.target.value, 10))}
              onMouseUp={() => save({ wrap_up_seconds: wrapUp })}
              onTouchEnd={() => save({ wrap_up_seconds: wrapUp })}
              className="h-2 flex-1 cursor-pointer accent-[#0d4b3a]"
            />
            <span className="w-16 text-right text-[14px] font-semibold tabular-nums text-[#0a0d14]">{wrapUp}s</span>
          </div>
        </div>
      </SectionCard>

      <div className="mt-6 flex h-6 items-center gap-2 text-[12px]">
        {saving && <span className="text-[#5b606a]">Saving...</span>}
        {saved && <span className="text-[#0d4b3a]">Saved</span>}
        {error && <span className="text-[#b42318]">{error}</span>}
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
      <div className="border-b border-[#f1f2f4] px-7 py-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">{eyebrow}</div>
        <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]">{title}</div>
        <div className="mt-1 text-[12.5px] text-[#5b606a]">{intro}</div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  subtitle,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-[#f1f2f4] px-7 py-5 last:border-b-0">
      <div className="flex flex-1 items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white"
          style={{
            background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.28)",
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-[#0a0d14]">{label}</div>
          <div className="mt-1 text-[12px] leading-[1.55] text-[#5b606a]">{subtitle}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition"
        style={{ background: on ? "#0d4b3a" : "#d6d4cd" }}
      >
        <span
          className="ml-0.5 h-5 w-5 rounded-full bg-white transition"
          style={{ transform: on ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 2px rgba(12,13,16,0.20)" }}
        />
      </button>
    </div>
  );
}
