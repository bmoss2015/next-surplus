import Link from "next/link";
import type { Metadata } from "next";
import { CANVAS_W, CANVAS_H, HAYES, PEMBERTON, QUEUE_DEFAULT, QUEUE_PEMBERTON, QUEUE_PROGRESSED, NEXT_LEAD_HAYES } from "./_data";
import { V44 } from "./_layouts/V44";
import { V45 } from "./_layouts/V45";

export const metadata: Metadata = {
  title: "Dialer Mockups Final | Next Surplus",
  description: "Power dialer mockups for the Moss Equity Operating team.",
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

const V44_SCREENS: Screen[] = [
  { key: "live", title: "Hayes · Live Call", href: "/share/dialer-mockup-final/v44", Component: () => <V44 lead={HAYES} queue={QUEUE_DEFAULT} /> },
  { key: "wrap", title: "Hayes · Wrap Up", href: "/share/dialer-mockup-final/v44-wrap", Component: () => <V44 lead={HAYES} queue={QUEUE_DEFAULT} state="wrap" nextLead={NEXT_LEAD_HAYES} /> },
  { key: "stateb", title: "Pemberton · Live Call", href: "/share/dialer-mockup-final/v44-state-b", Component: () => <V44 lead={PEMBERTON} queue={QUEUE_PEMBERTON} /> },
  { key: "progressed", title: "Queue Progressed", href: "/share/dialer-mockup-final/v44-queue-progressed", Component: () => <V44 lead={HAYES} queue={QUEUE_PROGRESSED} queuePosition={3} /> },
];

const V45_SCREENS: Screen[] = [
  { key: "live", title: "Hayes · Live Call", href: "/share/dialer-mockup-final/v45", Component: () => <V45 lead={HAYES} queue={QUEUE_DEFAULT} /> },
  { key: "wrap", title: "Hayes · Wrap Up", href: "/share/dialer-mockup-final/v45-wrap", Component: () => <V45 lead={HAYES} queue={QUEUE_DEFAULT} state="wrap" nextLead={NEXT_LEAD_HAYES} /> },
  { key: "stateb", title: "Pemberton · Live Call", href: "/share/dialer-mockup-final/v45-state-b", Component: () => <V45 lead={PEMBERTON} queue={QUEUE_PEMBERTON} /> },
  { key: "drawer", title: "Drawer Open", href: "/share/dialer-mockup-final/v45-drawer-open", Component: () => <V45 lead={HAYES} queue={QUEUE_DEFAULT} drawerOpen /> },
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
            Final Two Chassis
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Internal tool for the Moss Equity Operating team. Optimized for a VA running
            200 to 300 dials per day for 6+ hours. Each chassis has a Live Call screen
            for both a Hayes estate (deceased owner) and a Pemberton foreclosure (living
            owner), a Wrap Up screen, and a state-specific extra (V44 Queue Progressed,
            V45 Drawer Open). Setup page lives at /dialer-setup.
          </p>

          <nav className="mt-5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Jump To
            </span>
            <a href="#v44" className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-gray-50">
              V44
            </a>
            <a href="#v45" className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-gray-50">
              V45
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

        <Section
          id="v44"
          title="V44 · Three Zone Columns"
          chassis="20 / 55 / 25"
          premise="Temporal flow maps to spatial position. Left = what is next, center = current, right = lead reference."
          screens={V44_SCREENS}
        />

        <Section
          id="v45"
          title="V45 · Centered Cockpit + Drawer"
          chassis="Slim queue, centered hero, collapsible right drawer"
          premise="Hide most context behind a pull tab. The hero carries the call; the drawer carries the reference data."
          screens={V45_SCREENS}
        />
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  chassis,
  premise,
  screens,
}: {
  id: string;
  title: string;
  chassis: string;
  premise: string;
  screens: Screen[];
}) {
  const previewWidth = Math.round(PREVIEW_W * 0.5);
  const previewHeight = Math.round(PREVIEW_H * 0.5);
  const scale = SCALE * 0.5;
  return (
    <section
      id={id}
      className="mt-7 scroll-mt-8 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[16px] font-semibold tracking-tight text-ink">
            {title}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
            {chassis}
          </div>
        </div>
        <Link
          href={screens[0].href}
          className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-petrol-700 px-4 text-[12px] font-semibold text-white hover:bg-petrol-500"
        >
          Open V{id.slice(1)} Full Size
        </Link>
      </div>

      <p className="mb-4 max-w-[680px] text-[12.5px] leading-relaxed text-gray-600">
        <span className="font-semibold text-ink">Premise:</span> {premise}
      </p>

      <div className="grid grid-cols-4 gap-4">
        {screens.map((s) => (
          <div key={s.key}>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              {s.title}
            </div>
            <Link
              href={s.href}
              className="block cursor-pointer overflow-hidden rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.18)]"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
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
  );
}

function DecisionsBlock() {
  const groups = [
    {
      head: "Audience",
      items: [
        "Internal tool for Moss Equity Operating, not part of the SaaS launch.",
        "Optimized for a VA running 200 to 300 dials per day for 6 plus hours.",
        "Pre session setup at /dialer-setup; everything below is per-call surface.",
      ],
    },
    {
      head: "Hero",
      items: [
        "No avatar circle.",
        "Top row: case-type chip on left, Connected 04:32 dot+text on right (no pill).",
        "Title in Proper Case; relationship line; phone nowrap+tabular; address wraps at commas.",
        "Right side: 3-line financial stack (RECOVERY FEE / SURPLUS / NET TO FIRM) plus tiny Case L-2026-0218.",
        "Lead Summary bullets directly on the gradient, no Gemini attribution, no refresh button.",
      ],
    },
    {
      head: "Controls",
      items: [
        "5 equal buttons, 110px wide, 44px tall: Mute, Keypad, Hold, Transfer, Add Note.",
        "Add Note expands an inline 80px input below the row, no modal.",
        "End Call sits separately on the right, filled red, same height.",
        "Pause Session lives in the top header next to End Session.",
      ],
    },
    {
      head: "Wrap Up",
      items: [
        "Hero KEEPS the petrol gradient. Status flips to gray Call Ended 04:32.",
        "Lead Summary dims to 70%.",
        "Control row replaced in place: How did the call go? + 5 outcome chips + Quick Note + Skip Follow Up toggle.",
        "Sticky countdown banner: Next: Otis Crockett · Cousin of Heir · 0:03 · Dial Now · Skip.",
        "Selecting a chip auto-fires the configured follow up email. SMS deferred until A2P registered.",
      ],
    },
    {
      head: "Stats + Queue",
      items: [
        "4 metric strip: DIALS, CONNECTS, RATE, SESSION TALK. Number + single arrow only. Detail in hover tooltip.",
        "Queue header reads only Lead 3 of 100 (no duplicated session stats).",
        "Each row: position number left, Proper Case name bold, relationship below, surplus + location below.",
        "Completed leads: strikethrough, 50% opacity, check icon in place of the position number.",
        "Search input no border, bg #F5F5F5, / shortcut chip with Press / to focus tooltip.",
      ],
    },
    {
      head: "Lead Naming",
      items: [
        "Title = owner name (Wallace Pemberton) or property address (1818 Erie Crossing).",
        "Never include the word Estate or Foreclosure in the lead name.",
        "case_type drives the chip prefix: estate → Same Estate, foreclosure → Same Property, other → Same Case.",
        "Reference contacts (Attorney, County, Probate Clerk) flagged Not Dialable, excluded from the cascade.",
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
