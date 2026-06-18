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
  title: "Dialer V44 | Next Surplus",
  description: "Power dialer V44 mockup for the Moss Equity Operating team.",
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
  { key: "stateb", title: "Pemberton · Mortgage Foreclosure", href: "/share/dialer-mockup-final/v44-state-b", Component: () => <V44 lead={PEMBERTON} queue={QUEUE_PEMBERTON} /> },
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
            V44 · Five States
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Internal tool for the Moss Equity Operating team. Optimized for a VA running
            200 to 300 dials per day for 6+ hours. V44 is the only chassis. Two case
            states (Hayes Tax Sale with deceased owner, Pemberton Mortgage Foreclosure
            with living owner), a Wrap Up screen, a Queue Progressed screen showing
            completed leads, and an Activity Timeline overlay.
          </p>

          <nav className="mt-5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Jump To
            </span>
            <a href="#v44" className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-gray-50">
              V44 States
            </a>
            <Link
              href="/share/setup-a"
              className="cursor-pointer rounded-md bg-petrol-700 px-2.5 py-1 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] hover:bg-petrol-500"
            >
              Pre Session Setup
            </Link>
          </nav>
        </header>

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
