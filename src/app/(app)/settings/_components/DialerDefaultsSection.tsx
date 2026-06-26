"use client";

// Power Dialer org defaults: Recording, AMD, Transcription toggles.
// Admin only via parent panel gate. Operators can override these per
// session in the Setup Wizard's Customize For This Session panel.

import { useState, useTransition } from "react";
import {
  IconMicrophone,
  IconPhoneCall,
  IconFileText,
  IconCheck,
} from "@tabler/icons-react";
import type { DialerDefaults } from "@/lib/settings/fetch";
import { updateDialerDefaults } from "../_actions";

const PROVIDERS: { value: DialerDefaults["transcription_provider"]; label: string; cost: string; note: string }[] = [
  { value: "deepgram_nova", label: "Deepgram Nova", cost: "$0.0074/min", note: "Cheapest, recommended" },
  { value: "telnyx_stt", label: "Telnyx STT", cost: "$0.015/min", note: "Native Telnyx" },
  { value: "google_stt", label: "Google STT", cost: "$0.017/min", note: "Premium accuracy" },
  { value: "assemblyai", label: "AssemblyAI", cost: "$0.007/min", note: "Speaker diarization included" },
];

export function DialerDefaultsSection({ initial }: { initial: DialerDefaults }) {
  const [recording, setRecording] = useState(initial.call_recording_enabled);
  const [amd, setAmd] = useState(initial.amd_enabled);
  const [transcript, setTranscript] = useState(initial.transcription_enabled);
  const [provider, setProvider] = useState(initial.transcription_provider);
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
        <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
          Org-wide settings for every dialer session. Operators can override these for a single session from Customize For This Session in the Setup Wizard. Persistent changes are admin only.
        </p>
      </div>

      <SectionCard
        eyebrow="Telephony Add-Ons"
        title="Recording, Detection, Transcription"
        intro="Each toggle controls a Telnyx add-on. Costs pass through at the provider rate and are billed monthly on the customer subscription."
      >
        <ToggleRow
          icon={<IconMicrophone size={14} stroke={2.25} />}
          label="Call Recording"
          subtitle="Saves an MP3 of every connected call to the lead's activity timeline."
          cost="$0.002/min Telnyx pass-through"
          on={recording}
          onChange={(v) => { setRecording(v); save({ call_recording_enabled: v }); }}
        />
        <ToggleRow
          icon={<IconPhoneCall size={14} stroke={2.25} />}
          label="Answering Machine Detection"
          subtitle="Detects when a voicemail picks up so the dialer can skip or play a voicemail drop instead of ringing dead air."
          cost="$0.002/call Telnyx pass-through"
          on={amd}
          onChange={(v) => { setAmd(v); save({ amd_enabled: v }); }}
        />
        <ToggleRow
          icon={<IconFileText size={14} stroke={2.25} />}
          label="Live Call Transcription"
          subtitle="Generates a text transcript of every recorded call. Searchable, copyable, and feeds AI summaries on the lead detail page."
          cost="See provider below"
          on={transcript}
          onChange={(v) => { setTranscript(v); save({ transcription_enabled: v }); }}
        />

        {transcript && (
          <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-7 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Transcription Provider</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setProvider(p.value); save({ transcription_provider: p.value }); }}
                  className={[
                    "rounded-[8px] border bg-white px-4 py-3 text-left transition cursor-pointer",
                    provider === p.value ? "border-[#0d4b3a]" : "border-[#ebedf0] hover:border-[#9298a3]",
                  ].join(" ")}
                  style={provider === p.value ? { boxShadow: "0 0 0 3px rgba(13,75,58,0.10)" } : {}}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#0a0d14]">{p.label}</span>
                    {provider === p.value && <IconCheck size={12} stroke={2.5} className="text-[#0d4b3a]" />}
                  </div>
                  <div className="mt-1 text-[11.5px] tabular-nums font-semibold text-[#0a0d14]">{p.cost}</div>
                  <div className="mt-0.5 text-[11px] text-[#5b606a]">{p.note}</div>
                </button>
              ))}
            </div>
          </div>
        )}
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
  cost,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  cost: string;
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
        <div>
          <div className="text-[13.5px] font-semibold text-[#0a0d14]">{label}</div>
          <div className="mt-1 text-[12px] leading-[1.55] text-[#5b606a]">{subtitle}</div>
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">{cost}</div>
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
