import Link from "next/link";
import type { Metadata } from "next";
import {
  SETUP_CANVAS_W,
  SETUP_CANVAS_H,
  DOT_BG,
} from "./_components/SetupShared";
import { SetupA } from "./_components/SetupA";
import { SetupB } from "./_components/SetupB";
import { SetupC } from "./_components/SetupC";
import { SetupD } from "./_components/SetupD";

export const metadata: Metadata = {
  title: "Power Dialer Setup — 4 Approaches | Next Surplus",
};

const SCALE = 0.42;
const THUMB_W = Math.round(SETUP_CANVAS_W * SCALE);
const THUMB_H = Math.round(SETUP_CANVAS_H * SCALE);

type Option = {
  key: string;
  letter: string;
  title: string;
  pitch: string;
  anchor: string;
  href: string;
  Component: () => React.ReactElement;
};

const OPTIONS: Option[] = [
  {
    key: "a",
    letter: "A",
    title: "Wizard · 3 Steps",
    pitch: "Step by step, focused, slow for repeat use.",
    anchor: "Stripe checkout flow",
    href: "/share/setup-a",
    Component: () => <SetupA />,
  },
  {
    key: "b",
    letter: "B",
    title: "Two Pane With Defaults",
    pitch: "Single page, fast for daily use.",
    anchor: "Mailchimp campaign setup",
    href: "/share/setup-b",
    Component: () => <SetupB />,
  },
  {
    key: "c",
    letter: "C",
    title: "Single Page Hierarchy",
    pitch: "Top down scannable.",
    anchor: "Linear new project page",
    href: "/share/setup-c",
    Component: () => <SetupC />,
  },
  {
    key: "d",
    letter: "D",
    title: "Conversational",
    pitch: "Friendly but slow.",
    anchor: "Typeform multi question UI",
    href: "/share/setup-d",
    Component: () => <SetupD />,
  },
];

export default function SetupComparisonIndex() {
  return (
    <div className={`min-h-screen ${DOT_BG} bg-[#FAFAFA] px-7 py-8`}>
      <div className="mx-auto" style={{ maxWidth: THUMB_W * 2 + 80 }}>
        <header className="mb-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Next Surplus · Power Dialer
          </div>
          <h1 className="m-0 mt-1 text-[28px] font-semibold tracking-tight text-ink">
            Power Dialer Setup — 4 Approaches
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Same demo data, four distinct chassis for the pre session setup screen.
            47 leads filtered by Estate + Foreclosure across Cuyahoga, Lancaster,
            Franklin, and Hamilton counties; surplus $25K to $300K; last touch older
            than 30 days. Default dialer behavior wired the same across all four.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-6">
          {OPTIONS.map((o) => (
            <Link
              key={o.key}
              href={o.href}
              className="group block cursor-pointer rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]"
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-petrol-700 text-[13px] font-bold text-white">
                    {o.letter}
                  </span>
                  <div>
                    <div className="text-[15px] font-semibold tracking-tight text-ink">
                      {o.title}
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Anchor · {o.anchor}
                    </div>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-petrol-700 group-hover:underline">
                  View Full Page →
                </span>
              </div>
              <div className="text-[12.5px] text-gray-600">{o.pitch}</div>
              <div
                className="mt-4 overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200"
                style={{ width: THUMB_W, height: THUMB_H }}
              >
                <div
                  style={{
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                    width: SETUP_CANVAS_W,
                    height: SETUP_CANVAS_H,
                  }}
                >
                  <o.Component />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Visual Language Applied To All Four
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px] text-gray-600">
            {[
              "Page background: subtle 3% dot pattern on a 24px grid.",
              "Lead count callout: 47 Leads · Est. 4h 12m in large semibold petrol.",
              "Filter chips: petrol filled when active, gray outlined when inactive.",
              "Sliders: petrol fill on the selected portion.",
              "Selected lead rows: Proper Case bold name, surplus in petrol.",
              "Section icons: 16px next to each section or setting label.",
              "Start Session CTA: filled petrol gradient, soft shadow, 280px x 56px.",
              "SMS Pending notice consistent across all four.",
            ].map((s, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
