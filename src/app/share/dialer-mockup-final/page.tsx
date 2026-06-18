import Link from "next/link";
import type { Metadata } from "next";
import {
  CANVAS_W,
  CANVAS_H,
  HAYES,
  PEMBERTON,
  QUEUE_DEFAULT,
  QUEUE_PEMBERTON,
  QUEUE_PROGRESSED,
  NEXT_LEAD_HAYES,
} from "./_data";
import { V44 } from "./_layouts/V44";

export const metadata: Metadata = {
  title: "Dialer Mockup Final | Next Surplus",
  description: "Power dialer mockup for the Moss Equity Operating team.",
};

const SCALE = 0.45;
const PREVIEW_W = Math.round(CANVAS_W * SCALE);
const PREVIEW_H = Math.round(CANVAS_H * SCALE);

type Screen = {
  key: string;
  title: string;
  href: string;
  Component: () => React.ReactElement;
};

const SCREENS: Screen[] = [
  { key: "live", title: "Hayes · Live Call", href: "/share/dialer-mockup-final/v44", Component: () => <V44 lead={HAYES} queue={QUEUE_DEFAULT} /> },
  { key: "wrap", title: "Hayes · Wrap Up (Interested)", href: "/share/dialer-mockup-final/v44-wrap", Component: () => <V44 lead={HAYES} queue={QUEUE_DEFAULT} state="wrap" nextLead={NEXT_LEAD_HAYES} selectedOutcome="Interested" showToast /> },
  { key: "stateb", title: "Pemberton · Live Call", href: "/share/dialer-mockup-final/v44-state-b", Component: () => <V44 lead={PEMBERTON} queue={QUEUE_PEMBERTON} /> },
  { key: "progressed", title: "Queue Progressed", href: "/share/dialer-mockup-final/v44-queue-progressed", Component: () => <V44 lead={HAYES} queue={QUEUE_PROGRESSED} queuePosition={3} /> },
  { key: "timeline", title: "Activity Timeline Open", href: "/share/dialer-mockup-final/v44-timeline-open", Component: () => <V44 lead={HAYES} queue={QUEUE_DEFAULT} overlay="timeline" /> },
];

export default function DialerMockupFinalIndex() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-7 py-8">
      <div className="mx-auto" style={{ maxWidth: PREVIEW_W * 2 + 80 }}>
        <header className="mb-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Next Surplus · Power Dialer
          </div>
          <h1 className="m-0 mt-1 text-[28px] font-semibold tracking-tight text-ink">
            V44 Polish + Pre Session Setup
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Internal tool for the Moss Equity Operating team. Optimized for a VA running
            200 to 300 dials per day for 6 plus hours. V44 is the single chassis. The
            right column is one white surface with section dividers. Hero financial stack
            is 3 perfectly aligned rows. Wrap Up replaces controls with the Call Outcome
            chip row. Pre Session Setup lives at /dialer-setup.
          </p>

          <nav className="mt-5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Jump To
            </span>
            <a href="#v44" className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-gray-50">
              V44 States
            </a>
            <Link
              href="/share/dialer-mockup-final/dialer-setup"
              className="cursor-pointer rounded-md bg-petrol-700 px-2.5 py-1 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-petrol-500"
            >
              Pre Session Setup
            </Link>
          </nav>
        </header>

        <DecisionsBlock />

        <section
          id="v44"
          className="mt-7 scroll-mt-8 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[16px] font-semibold tracking-tight text-ink">
                V44 · Three Zone Columns
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                20 / 55 / 25
              </div>
            </div>
            <Link
              href={SCREENS[0].href}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-petrol-700 px-4 text-[12px] font-semibold text-white hover:bg-petrol-500"
            >
              Open V44 Full Size
            </Link>
          </div>

          <p className="mb-4 max-w-[680px] text-[12.5px] leading-relaxed text-gray-600">
            <span className="font-semibold text-ink">Premise:</span> Temporal flow maps
            to spatial position. Left = what is next, center = current, right = lead
            reference (one merged surface, three sections).
          </p>

          <div className="grid grid-cols-3 gap-4">
            {SCREENS.map((s) => (
              <div key={s.key}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  {s.title}
                </div>
                <Link
                  href={s.href}
                  className="block cursor-pointer overflow-hidden rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.18)]"
                  style={{ width: PREVIEW_W, height: PREVIEW_H }}
                >
                  <div
                    style={{
                      transform: `scale(${SCALE})`,
                      transformOrigin: "top left",
                      width: CANVAS_W,
                      height: CANVAS_H,
                    }}
                  >
                    <s.Component />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DecisionsBlock() {
  const groups = [
    {
      head: "Hero",
      items: [
        "No avatar circle.",
        "Case-type chip universal wording: Same Case · Contact X of Y. Estate and Property never appear.",
        "Status: green dot + Connected timer on the right; no pill.",
        "Financial: 3 perfectly aligned rows (RECOVERY FEE 30%, SURPLUS $521,900, NET TO FIRM $146,132). All labels 11px uppercase gray; all values 24px white semibold.",
        "Case number REMOVED from hero. Lives only in the Case Details section.",
        "Lead Summary bullets sit directly on the gradient, no Gemini attribution, no refresh button.",
      ],
    },
    {
      head: "Right Column",
      items: [
        "ONE white panel spanning the column. Not three floating cards.",
        "Three sections separated by 1px gray-at-8% dividers.",
        "Headers Proper Case: Case Details, Latest Activity, Contact Tree.",
        "16px internal padding per section. View Timeline link in the Latest Activity header.",
        "Contact Tree max-height 300px with internal scroll.",
      ],
    },
    {
      head: "Controls",
      items: [
        "5 equal 110px x 44px buttons: Mute, Keypad, Hold, Transfer, Add Note.",
        "All white-filled with petrol text + 0 1px 2px shadow. Add Note slightly bolder weight as the active CTA.",
        "End Call sits separately on the right, filled red, same height and shadow.",
        "Pause Session (white + petrol) + End Session (red) in top header carry the same treatment.",
      ],
    },
    {
      head: "Wrap Up",
      items: [
        "Hero KEEPS the petrol gradient. Status flips to gray Call Ended.",
        "Lead Summary dims to 70%.",
        "Section header reads Call Outcome (Proper Case). No question header.",
        "5 outcome chips: outlined on the gradient, filled white + petrol on select.",
        "Quick Note: no fill, white text on the gradient, thin 1px white-at-30% underline.",
        "Sticky countdown banner. Typography aligned: Name 14px medium, Relationship 12px regular, Countdown 16px tabular.",
      ],
    },
    {
      head: "Email Auto Send",
      items: [
        "Outcome click queues the configured email and shows a top-right toast: Follow Up Email Queued + Undo.",
        "5 second undo window. Countdown continues, does not block.",
        "Email sends in background after the window closes.",
        "Per-call suppression with the Skip Follow Up This Call toggle.",
      ],
    },
    {
      head: "Note Safety + Queue",
      items: [
        "If countdown hits 0 while the note field is focused with unsaved text, countdown PAUSES. Banner offers Save And Dial or Discard.",
        "If the note field is empty or unfocused at 0, the next call auto-fires. Saved note posts to the previous lead.",
        "Queue header reads only Lead 3 of 100. 12 leads visible; thin 4px scrollbar always visible.",
        "Done rows: strikethrough + 50% opacity + check icon in place of position number.",
      ],
    },
  ];
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        Locked Decisions
      </div>
      <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-5">
        {groups.map((g) => (
          <div key={g.head}>
            <div className="text-[12px] font-semibold tracking-tight text-ink">
              {g.head}
            </div>
            <ul className="mt-1.5 space-y-1">
              {g.items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-2 text-[11.5px] leading-snug text-gray-600"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
                  <span className="flex-1">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
