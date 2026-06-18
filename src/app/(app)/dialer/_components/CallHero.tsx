"use client";

import {
  IconMicrophone,
  IconHandStop,
  IconArrowsTransferUp,
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
  quickNote,
  setQuickNote,
  countdown,
  onNextLead,
  onSkipLead,
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
  countdown: number;
  onNextLead: () => void;
  onSkipLead: () => void;
  paused: boolean;
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
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-white/70">
              Contact {contactIndex + 1} of {totalContacts}
            </span>
            {state === "live" && contactIndex < lead.contacts.length - 1 && (
              <button
                type="button"
                onClick={onSkipLead}
                className="text-[11.5px] font-medium text-white/70 transition hover:text-white"
              >
                Skip To Next Lead →
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={[
                "h-2 w-2 rounded-full",
                state === "live" ? "bg-[#34d399]" : "bg-gray-300",
              ].join(" ")}
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

      {state === "live" ? (
        <>
          <div className="grid flex-1 min-h-0 grid-cols-[1fr_1.15fr] gap-6">
            <div className="flex min-h-0 flex-col">
              <div className="text-[12.5px] font-semibold uppercase tracking-[0.10em] text-white/70">
                Lead Summary
              </div>
              <ul className="mt-3 space-y-2.5 overflow-y-auto pr-1">
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

            <div className="flex min-h-0 flex-col">
              <div className="text-[12.5px] font-semibold uppercase tracking-[0.10em] text-white/70">
                Call Note
              </div>
              <div className="mt-3 flex flex-1 min-h-0 flex-col">
                <NoteTextarea
                  value={quickNote}
                  onChange={setQuickNote}
                  placeholder="Capture key details from this call"
                  fill
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-stretch gap-1">
              <ControlButton icon={IconMicrophone} label="Mute" />
              <ControlButton icon={IconNumber} label="Keypad" />
              <ControlButton icon={IconHandStop} label="Hold" />
              <ControlButton icon={IconArrowsTransferUp} label="Transfer" />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <DispositionButton
                label="No Answer"
                onClick={() => onOutcome("No Answer")}
              />
              <DispositionButton
                label="Voicemail"
                onClick={() => onOutcome("Voicemail")}
              />
              <DispositionButton
                label="Wrong Number"
                onClick={() => onOutcome("Wrong Number")}
              />
              <DispositionButton
                label="Disconnected"
                onClick={() => onOutcome("Disconnected")}
              />
              <button
                type="button"
                onClick={onEndCall}
                className="ml-1.5 flex h-9 items-center gap-1.5 rounded-full bg-[#b91c1c] px-4 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.10),0_3px_8px_-2px_rgba(185,28,28,0.30)] transition hover:bg-[#a01818] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15),0_4px_12px_-2px_rgba(185,28,28,0.40)]"
              >
                <IconPhoneOff size={13} stroke={2.25} />
                End Call
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 px-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Wrap Up
            </span>
            <span className="text-[20px] font-medium tabular-nums text-white">
              {paused ? "Paused" : `${formatCountdown(countdown)} remaining`}
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

          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onNextLead}
              className="flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-[13.5px] font-semibold text-ink shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition hover:bg-gray-100"
            >
              Next Lead
              <IconArrowRight size={15} stroke={2.25} />
            </button>
          </div>
        </div>
      )}
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
        "flex flex-col gap-1.5",
        fill ? "flex-1 min-h-0" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-0.5">
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
        <span className="mx-0.5 h-3.5 w-px bg-white/15" />
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
        onClick={() => editor.commands.focus()}
        className={[
          "relative cursor-text overflow-y-auto rounded-lg bg-white/[0.06] px-3.5 py-2.5 transition focus-within:bg-white/[0.09]",
          fill ? "flex-1 min-h-0" : "max-h-[220px] min-h-[72px]",
        ].join(" ")}
      >
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-3.5 top-2.5 text-[13.5px] text-white/50">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} className="min-h-full" />
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
            ? "bg-white/15 text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white")
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
      className={[
        "flex h-11 w-[78px] flex-col items-center justify-center gap-1 rounded-lg px-1 transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/70 hover:bg-white/[0.08] hover:text-white",
      ].join(" ")}
    >
      <Icon size={15} stroke={2} />
      <span className="whitespace-nowrap text-[10.5px] font-medium leading-none">{label}</span>
    </button>
  );
}

function DispositionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-full bg-white px-3.5 text-[12px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:-translate-y-px hover:bg-gray-50 hover:shadow-[0_3px_8px_rgba(0,0,0,0.15)] active:translate-y-0 active:bg-[#13644e] active:text-white active:shadow-[0_1px_2px_rgba(13,75,58,0.30)]"
    >
      {label}
    </button>
  );
}
