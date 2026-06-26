"use client";

// Side-drawer transcript view for call activity rows on the lead detail
// page. Search bar at the top of the drawer highlights matching tokens
// inside the transcript. Reads session_calls.transcription_text + recording_url.
// No AI summary.

import { useState } from "react";
import { IconX, IconSearch, IconDownload, IconCopy } from "@tabler/icons-react";

export type TranscriptCall = {
  callId: string;
  durationSeconds: number | null;
  recordingUrl: string | null;
  transcriptionText: string | null;
  transcriptionStatus: string | null;
  contactName?: string | null;
  startedAt: string;
};

function fmtDuration(secs: number | null): string {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="rounded-[3px] bg-[#fef3c7] px-0.5 text-[#0a0d14]">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function TranscriptDrawer({
  call,
  onClose,
}: {
  call: TranscriptCall | null;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const lines = call?.transcriptionText
    ? call.transcriptionText.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    : [];

  const matchCount = (() => {
    if (!query.trim() || !call?.transcriptionText) return 0;
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const m = call.transcriptionText.match(re);
    return m ? m.length : 0;
  })();

  function copyTranscript() {
    if (!call?.transcriptionText) return;
    navigator.clipboard.writeText(call.transcriptionText).catch(() => {});
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-[#0a0d14]/30 transition-opacity",
          call ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-screen w-[440px] flex-col border-l border-[#ebedf0] bg-white transition-transform",
          call ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{ boxShadow: "-16px 0 40px -8px rgba(15,23,41,0.18)" }}
      >
        {call && (
          <>
            <div className="border-b border-[#ebedf0] bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Call Transcript</div>
                  <div className="mt-1 text-[14px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
                    {call.contactName ?? "Call"} · {fmtDuration(call.durationSeconds)}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#9298a3]">{fmtTime(call.startedAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#9298a3] transition hover:bg-[#f1f2f4] hover:text-[#0a0d14]"
                >
                  <IconX size={16} stroke={2.25} />
                </button>
              </div>

              {call.recordingUrl && (
                <audio controls src={call.recordingUrl} className="mt-3 h-9 w-full" />
              )}
            </div>

            <div className="border-b border-[#ebedf0] bg-[#fafbfc] px-5 py-3">
              <div className="relative">
                <IconSearch
                  size={13}
                  stroke={2.25}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9298a3]"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this transcript"
                  className="h-9 w-full rounded-[7px] border border-[#ebedf0] bg-white pl-9 pr-16 text-[13px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#9298a3]"
                />
                {query.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-[#9298a3]">
                    {matchCount} {matchCount === 1 ? "match" : "matches"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {call.transcriptionStatus === "pending" ? (
                <div className="rounded-[8px] border border-[#ebedf0] bg-[#fafbfc] px-4 py-6 text-center text-[12.5px] text-[#5b606a]">
                  Transcription in progress. This usually takes a minute or two after the call ends.
                </div>
              ) : !call.transcriptionText ? (
                <div className="rounded-[8px] border border-[#ebedf0] bg-[#fafbfc] px-4 py-6 text-center text-[12.5px] text-[#5b606a]">
                  No transcript on file. Transcription may be turned off in Settings &rsaquo; Power Dialer &rsaquo; Defaults.
                </div>
              ) : (
                <div className="space-y-3 text-[13.5px] leading-[1.6] text-[#0a0d14]">
                  {lines.map((line, i) => (
                    <p key={i} className="rounded-[6px] px-2 py-1 hover:bg-[#fafbfc]">
                      {highlight(line, query)}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {call.transcriptionText && (
              <div className="border-t border-[#ebedf0] bg-white px-5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyTranscript}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[11.5px] font-medium text-[#5b606a] transition hover:border-[#0d4b3a]"
                  >
                    <IconCopy size={11} stroke={2.25} />
                    Copy
                  </button>
                  {call.recordingUrl && (
                    <a
                      href={call.recordingUrl}
                      download
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[11.5px] font-medium text-[#5b606a] transition hover:border-[#0d4b3a]"
                    >
                      <IconDownload size={11} stroke={2.25} />
                      Download Audio
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
