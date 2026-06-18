"use client";

import {
  IconMicrophone,
  IconHandStop,
  IconArrowsTransferUp,
  IconNote,
  IconPhoneOff,
  IconNumber,
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
  IconArrowBack,
  IconArrowForward,
  IconArrowRight,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CallOutcome, DialerLead } from "../_mock-data";

type CallState = "live" | "wrapup";

const OUTCOMES: CallOutcome[] = [
  "Connected",
  "Voicemail",
  "No Answer",
  "Wrong Number",
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
  countdown,
  onNextLead,
  paused,
}: {
  lead: DialerLead;
  contactIndex: number;
  totalContacts: number;
  state: CallState;
  onEndCall: () => void;
  onOutcome: (o: CallOutcome) => void;
  selectedOutcome: CallOutcome;
  quickNote: string;
  setQuickNote: (s: string) => void;
  skipFollowUp: boolean;
  setSkipFollowUp: (b: boolean) => void;
  countdown: number;
  onNextLead: () => void;
  paused: boolean;
}) {
  const [elapsed, setElapsed] = useState(272);
  const [liveNoteOpen, setLiveNoteOpen] = useState(false);
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

      {state === "live" && (
        <div>
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
      )}

      <div
        className={[
          state === "wrapup"
            ? "flex flex-1 flex-col"
            : "mt-auto pt-6",
        ].join(" ")}
      >
        {state === "live" ? (
          <div className="space-y-4">
            {liveNoteOpen && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="text-[12.5px] font-semibold uppercase tracking-[0.10em] text-white/70">
                    Call Note
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveNoteOpen(false)}
                    className="text-[11.5px] font-medium text-white/70 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <NoteTextarea
                  value={quickNote}
                  onChange={setQuickNote}
                  placeholder="Capture key details from this call"
                  autoFocus
                />
              </div>
            )}
            <div className="flex items-end justify-between">
              <div className="flex gap-2">
                <ControlButton icon={IconMicrophone} label="Mute" />
                <ControlButton icon={IconNumber} label="Keypad" />
                <ControlButton icon={IconHandStop} label="Hold" />
                <ControlButton icon={IconArrowsTransferUp} label="Transfer" />
                <ControlButton
                  icon={IconNote}
                  label="Add Note"
                  active={liveNoteOpen}
                  onClick={() => setLiveNoteOpen((o) => !o)}
                />
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
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="grid grid-cols-4 gap-2">
              {OUTCOMES.map((o) => {
                const sel = selectedOutcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOutcome(o)}
                    className={[
                      "h-10 rounded-full px-4 text-[13px] font-semibold transition",
                      sel
                        ? "bg-white text-ink"
                        : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                    ].join(" ")}
                  >
                    {o}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 px-1">
              <span className="text-[12px] uppercase tracking-[0.10em] text-white/55">
                {selectedOutcome === "Connected" ? "Wrap Up" : "Skipping Wrap Up"}
              </span>
              <span className="text-[16px] font-medium tabular-nums text-white/85">
                {paused
                  ? "Paused"
                  : selectedOutcome === "Connected"
                    ? `${formatCountdown(countdown)} remaining`
                    : "Auto advancing"}
              </span>
            </div>

            <div className="mt-3 flex flex-1 flex-col min-h-0">
              <NoteTextarea
                value={quickNote}
                onChange={setQuickNote}
                placeholder="Capture key details from this call"
                autoFocus
                fill
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-white/85">
                <input
                  type="checkbox"
                  checked={skipFollowUp}
                  onChange={(e) => setSkipFollowUp(e.target.checked)}
                  className="h-3.5 w-3.5 accent-white"
                />
                Skip Follow Up
              </label>
              <button
                type="button"
                onClick={onNextLead}
                className="flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-[13.5px] font-semibold text-ink transition hover:bg-gray-100"
              >
                Next Lead
                <IconArrowRight size={15} stroke={2.25} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatCountdown(secs: number) {
  const safe = Math.max(0, Math.ceil(secs));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function NoteTextarea({
  value,
  onChange,
  placeholder,
  autoFocus,
  fill,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  fill?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "dialer-note-editor focus:outline-none text-[13.5px] leading-[1.65] text-white",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (autoFocus) editor.commands.focus("end");
  }, [autoFocus, editor]);

  useEffect(() => {
    if (!editor) return;
    if ((value || "") !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const isEmpty = editor.isEmpty;

  return (
    <div
      className={[
        "rounded-lg bg-black/20 ring-1 ring-white/25 transition focus-within:bg-black/25 focus-within:ring-white/35",
        fill ? "flex flex-1 flex-col min-h-0" : "",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center gap-0.5 border-b border-white/15 px-2 py-1.5">
        <NoteToolBtn
          icon={IconBold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <NoteToolBtn
          icon={IconItalic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <span className="mx-0.5 h-3.5 w-px bg-white/20" />
        <NoteToolBtn
          icon={IconList}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <NoteToolBtn
          icon={IconListNumbers}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <div className="ml-auto flex items-center gap-0.5">
          <NoteToolBtn
            icon={IconArrowBack}
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <NoteToolBtn
            icon={IconArrowForward}
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </div>
      </div>
      <div
        className={[
          "relative overflow-y-auto px-3.5 py-2.5",
          fill ? "flex-1 min-h-0" : "max-h-[220px] min-h-[72px]",
        ].join(" ")}
      >
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-3.5 top-2.5 text-[13.5px] text-white/55">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .dialer-note-editor p {
          margin: 0.2em 0;
        }
        .dialer-note-editor ul {
          list-style: disc;
          padding-left: 1.4em;
          margin: 0.3em 0;
        }
        .dialer-note-editor ol {
          list-style: decimal;
          padding-left: 1.6em;
          margin: 0.3em 0;
        }
        .dialer-note-editor strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function NoteToolBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; stroke: number }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-md p-1.5 transition-colors " +
        (disabled
          ? "text-white/25"
          : active
            ? "bg-white/20 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white")
      }
    >
      <Icon size={13} stroke={1.75} />
    </button>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] items-baseline gap-x-12">
      <span className="text-[16px] text-white/85">{label}</span>
      <span className="text-right text-[16px] font-semibold tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-[110px] flex-col items-center justify-center gap-0.5 rounded-lg text-white transition hover:bg-[rgba(4,38,28,0.40)]"
      style={{
        background: active ? "rgba(255,255,255,0.18)" : "rgba(4,38,28,0.55)",
      }}
    >
      <Icon size={15} stroke={2} />
      <span className="text-[11.5px] font-medium leading-none">{label}</span>
    </button>
  );
}
