/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  IconPhone,
  IconClock,
  IconUser,
  IconMicrophone,
  IconCopy,
  IconDownload,
  IconFileText,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

type Speaker = "agent" | "lead";
type Line = { id: number; t: number; speaker: Speaker; text: string };

const TRANSCRIPT: Line[] = [
  { id: 1, t: 2, speaker: "agent", text: "Hi, is this James Whittaker?" },
  { id: 2, t: 5, speaker: "lead", text: "Yeah, who's this?" },
  { id: 3, t: 7, speaker: "agent", text: "This is Bree calling from Next Surplus. I'm reaching out about a tax sale that happened on your property at 1742 Sandcrest in Fort Bend County back in March. There's roughly $42,000 in surplus funds sitting with the county clerk that you're entitled to claim. Got a minute to walk through how that works?" },
  { id: 4, t: 22, speaker: "lead", text: "Wait, surplus funds? I thought I lost the house, that's it." },
  { id: 5, t: 26, speaker: "agent", text: "That's a common assumption. The way a tax sale works in Texas, the property gets sold to cover the tax debt. But if it sells for more than what was owed, the excess goes to you, the former owner. The county doesn't notify people about it. Most folks have no idea they're owed anything." },
  { id: 6, t: 42, speaker: "lead", text: "And how much did you say it was?" },
  { id: 7, t: 45, speaker: "agent", text: "Roughly forty-two thousand. The exact amount gets confirmed when the claim is filed, but that's the ballpark from the county records I pulled this morning." },
  { id: 8, t: 56, speaker: "lead", text: "Huh. And what's your cut?" },
  { id: 9, t: 58, speaker: "agent", text: "Standard contingency. Thirty percent, no recovery no fee. The attorney's filing fee comes out of that. Everything else is yours. I can send you a one-pager that walks through the whole process if you'd like to look it over before deciding anything." },
  { id: 10, t: 75, speaker: "lead", text: "Yeah, send it. What's the catch?" },
  { id: 11, t: 78, speaker: "agent", text: "Honestly, the only catch is the deadline. Texas gives former owners two years from the sale date to claim. After that the funds escheat to the state and you can't recover them. We're well inside the window but I wouldn't sit on it." },
];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TranscriptsPreviewPage() {
  const [variant, setVariant] = useState<"timeline" | "modal" | "side">("side");
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <Header variant={variant} setVariant={setVariant} />

      <div className="mx-auto max-w-[1280px] px-8 py-10">
        {variant === "timeline" && <TimelineVariant open={open} setOpen={setOpen} />}
        {variant === "modal" && <ModalVariant />}
        {variant === "side" && <SidePanelVariant />}
      </div>
    </div>
  );
}

function Header({ variant, setVariant }: { variant: "timeline" | "modal" | "side"; setVariant: (v: "timeline" | "modal" | "side") => void }) {
  return (
    <div className="border-b border-[#ebedf0] bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-8 py-5">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">Mockup</div>
          <div className="mt-1 text-[20px] font-semibold tracking-[-0.020em] text-[#0a0d14]">Call Transcripts &mdash; Three Placements</div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-[8px] bg-[#f1f2f4] p-1">
          {(["timeline", "modal", "side"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={[
                "cursor-pointer rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition",
                variant === v ? "bg-white text-[#0a0d14]" : "text-[#5b606a]",
              ].join(" ")}
              style={variant === v ? { boxShadow: "0 1px 2px rgba(12,13,16,0.08)" } : {}}
            >
              {v === "timeline" ? "Inline In Activity Timeline" : v === "modal" ? "Full Transcript Modal" : "Side Drawer"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineVariant({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  return (
    <div>
      <SectionLabel>Lead Detail &mdash; Activity Timeline</SectionLabel>
      <div className="rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
        <TimelineItem
          icon={<IconPhone size={14} stroke={2.25} />}
          eyebrow="Call"
          title="Bree Moss called James Whittaker"
          meta="Today &middot; 9:42 AM &middot; 1:42 talk time"
        >
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="flex items-center gap-3 rounded-[7px] border border-[#ebedf0] bg-[#fafbfc] px-3 py-2">
              <button type="button" className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0d4b3a] text-white">
                <svg width="11" height="13" viewBox="0 0 11 13" fill="none"><path d="M1 1L10 6.5L1 12V1Z" fill="currentColor" /></svg>
              </button>
              <div className="flex-1">
                <div className="flex h-1 w-full overflow-hidden rounded-full bg-[#e4e7ec]">
                  <div className="h-full w-[34%] bg-[#0d4b3a]" />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] tabular-nums text-[#9298a3]">
                  <span>0:34</span>
                  <span>1:42</span>
                </div>
              </div>
            </div>
            <button type="button" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#5b606a] hover:border-[#0d4b3a]">
              <IconDownload size={12} stroke={2.25} />
              MP3
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[10px] border border-[#ebedf0]">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between gap-3 bg-[#fafbfc] px-4 py-2.5 text-left hover:bg-[#f1f2f4]">
              <div className="flex items-center gap-2">
                <IconFileText size={12} stroke={2.25} className="text-[#0d4b3a]" />
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#0a0d14]">Transcript</span>
                <span className="text-[11px] text-[#9298a3]">Deepgram Nova &middot; 11 turns</span>
              </div>
              {open ? <IconChevronUp size={13} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={13} stroke={2} className="text-[#9298a3]" />}
            </button>
            {open && (
              <div className="bg-white p-5">
                <TranscriptBody />
                <div className="mt-4 flex items-center gap-2 border-t border-[#f1f2f4] pt-3">
                  <button type="button" className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[11.5px] font-medium text-[#5b606a] hover:border-[#0d4b3a]">
                    <IconCopy size={11} stroke={2.25} />
                    Copy
                  </button>
                  <button type="button" className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[11.5px] font-medium text-[#5b606a] hover:border-[#0d4b3a]">
                    <IconDownload size={11} stroke={2.25} />
                    Download Txt
                  </button>
                </div>
              </div>
            )}
          </div>
        </TimelineItem>

        <TimelineDivider />

        <TimelineItem
          icon={<IconUser size={14} stroke={2.25} />}
          eyebrow="Note"
          title="Lead requested one-pager"
          meta="Today &middot; 9:44 AM"
        >
          <p className="mt-2 text-[13px] leading-[1.55] text-[#0a0d14]">Send the surplus recovery one-pager. He&apos;s interested but cautious about the catch. Mention the 2-year deadline.</p>
        </TimelineItem>
      </div>
    </div>
  );
}

function ModalVariant() {
  return (
    <div>
      <SectionLabel>Lead Detail &mdash; Full Transcript Modal Open</SectionLabel>
      <div className="rounded-[14px] border border-[#ebedf0] bg-white p-8" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
        <div className="flex items-center justify-between gap-4 border-b border-[#ebedf0] pb-5">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.020em] text-[#0a0d14]">Call With James Whittaker</h2>
            <p className="mt-1 text-[12.5px] text-[#5b606a]">Today &middot; 9:42 AM &middot; 1:42 talk time &middot; Outbound</p>
          </div>
          <div className="inline-flex items-center gap-2">
            <button type="button" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#5b606a]">
              <IconDownload size={12} stroke={2.25} />
              MP3
            </button>
            <button type="button" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#5b606a]">
              <IconCopy size={12} stroke={2.25} />
              Copy Transcript
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_280px] gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Transcript</div>
            <div className="mt-3 max-h-[520px] overflow-y-auto rounded-[10px] border border-[#ebedf0] bg-white p-5">
              <TranscriptBody />
            </div>
          </div>
          <div>
            <div className="rounded-[10px] border border-[#ebedf0] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Disposition</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] bg-[#0d4b3a] px-2 py-0.5 text-[11px] font-semibold text-white">
                Interested
              </div>
              <div className="mt-3 text-[12.5px] text-[#5b606a]">Next Step</div>
              <div className="mt-1 text-[13px] font-medium text-[#0a0d14]">Send one-pager via email</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidePanelVariant() {
  return (
    <div>
      <SectionLabel>Lead Detail &mdash; Side Drawer From Activity Timeline</SectionLabel>
      <div className="grid grid-cols-[1fr_420px] gap-0 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
        <div className="p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">Activity</div>
          <div className="mt-3">
            <TimelineItem
              icon={<IconPhone size={14} stroke={2.25} />}
              eyebrow="Call"
              title="Bree Moss called James Whittaker"
              meta="Today &middot; 9:42 AM &middot; 1:42 talk time"
            >
              <button type="button" className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#0d4b3a] px-3 text-[11.5px] font-medium text-white">
                <IconFileText size={11} stroke={2.25} />
                Open Transcript
              </button>
            </TimelineItem>
          </div>
        </div>

        <div className="border-l border-[#ebedf0] bg-[#fafbfc]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ebedf0] bg-white px-5 py-4">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Call Transcript</div>
              <div className="mt-1 text-[14px] font-semibold tracking-[-0.014em] text-[#0a0d14]">James Whittaker &middot; 1:42</div>
            </div>
            <button type="button" className="text-[#9298a3] hover:text-[#0a0d14]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-5">
            <div className="rounded-[10px] border border-[#ebedf0] bg-white p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Disposition</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] bg-[#0d4b3a] px-2 py-0.5 text-[11px] font-semibold text-white">
                Interested
              </div>
              <div className="mt-3 text-[12.5px] text-[#5b606a]">Next Step</div>
              <div className="mt-1 text-[13px] font-medium text-[#0a0d14]">Send one-pager via email</div>
            </div>

            <div className="mt-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Transcript</div>
              <div className="mt-3 max-h-[420px] overflow-y-auto rounded-[10px] border border-[#ebedf0] bg-white p-4">
                <TranscriptBody compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptBody({ compact }: { compact?: boolean } = {}) {
  return (
    <div className={["flex flex-col", compact ? "gap-3" : "gap-4"].join(" ")}>
      {TRANSCRIPT.map((line) => (
        <div key={line.id} className="grid grid-cols-[44px_1fr] gap-3">
          <div className="pt-0.5 text-right text-[10.5px] tabular-nums text-[#9298a3]">{fmtTime(line.t)}</div>
          <div>
            <div className={[
              "text-[10.5px] font-semibold uppercase tracking-[0.08em]",
              line.speaker === "agent" ? "text-[#0d4b3a]" : "text-[#9298a3]",
            ].join(" ")}>
              {line.speaker === "agent" ? "Bree" : "James"}
            </div>
            <div className={[compact ? "mt-0.5" : "mt-1", "text-[13.5px] leading-[1.55] text-[#0a0d14]"].join(" ")}>
              {line.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ icon, eyebrow, title, meta, children }: { icon: React.ReactNode; eyebrow: string; title: string; meta: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-3 px-6 py-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d4b3a] text-white">{icon}</div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">{eyebrow}</span>
          <span className="text-[10.5px] text-[#c2c5cc]">&middot;</span>
          <span className="text-[10.5px] text-[#9298a3]">{meta}</span>
        </div>
        <div className="mt-1 text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{title}</div>
        {children}
      </div>
    </div>
  );
}

function TimelineDivider() {
  return <div className="mx-6 border-t border-[#f1f2f4]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]" style={{ border: "1px solid #ebedf0" }}>
      <IconMicrophone size={11} stroke={2.25} className="text-[#0d4b3a]" />
      {children}
    </div>
  );
}
