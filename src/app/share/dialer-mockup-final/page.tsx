import Link from "next/link";
import type { Metadata } from "next";
import { CANVAS_W, CANVAS_H } from "./_data";
import { V44 } from "./_layouts/V44";
import { V45 } from "./_layouts/V45";

export const metadata: Metadata = {
  title: "Dialer Mockups Final | Next Surplus",
  description: "Two power dialer chassis for the Next Surplus call screen.",
};

const SCALE = 0.55;
const PREVIEW_W = Math.round(CANVAS_W * SCALE);
const PREVIEW_H = Math.round(CANVAS_H * SCALE);

type Screen = { key: string; title: string; href: string; Component: () => React.ReactElement };

const V44_SCREENS: Screen[] = [
  { key: "live", title: "Live Call", href: "/share/dialer-mockup-final/v44", Component: () => <V44 /> },
  { key: "wrap", title: "Wrap Up", href: "/share/dialer-mockup-final/v44-wrap", Component: () => <V44 wrap /> },
];

const V45_SCREENS: Screen[] = [
  { key: "live", title: "Live Call", href: "/share/dialer-mockup-final/v45", Component: () => <V45 /> },
  { key: "wrap", title: "Wrap Up", href: "/share/dialer-mockup-final/v45-wrap", Component: () => <V45 wrap /> },
  { key: "drawer", title: "Drawer Open", href: "/share/dialer-mockup-final/v45-drawer-open", Component: () => <V45 drawerOpen /> },
];

export default function DialerMockupFinalIndex() {
  return (
    <div className="min-h-screen bg-gray-50 px-7 py-8">
      <div className="mx-auto" style={{ maxWidth: PREVIEW_W * 2 + 80 }}>
        <header className="mb-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Next Surplus · Power Dialer
          </div>
          <h1 className="m-0 mt-1 text-[28px] font-semibold tracking-tight text-ink">
            Final Two Chassis
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Two structurally distinct call screens with the locked design system applied. Hero is
            flattened: no nested tinted boxes, typography hierarchy plus 1px white-at-20% dividers
            carry the structure. Right column (V44) and Drawer (V45) keep white cards on off-white,
            16px padding, 8px radius. Wrap Up keeps the petrol hero, dims the AI summary to 70%,
            and replaces the control row in place with disposition chips.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Lead · Cornelius J. Hayes Jr.
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Son of Deceased Owner
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Hayes Estate · $146,132 Net to Firm
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Cuyahoga County · Tax Sale May 6
            </span>
          </div>

          <nav className="mt-5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Jump To
            </span>
            <a
              href="#v44"
              className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 ring-1 ring-inset ring-gray-200 hover:bg-petrol-100"
            >
              V44
            </a>
            <a
              href="#v45"
              className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 ring-1 ring-inset ring-gray-200 hover:bg-petrol-100"
            >
              V45
            </a>
          </nav>
        </header>

        <DecisionsBlock />

        <Section
          id="v44"
          title="V44 · Three Zone Columns"
          chassis="20 / 55 / 25"
          premise="Temporal flow maps to spatial position. Left = what is next, center = current, right = lead reference."
          screens={V44_SCREENS}
          colCount={2}
        />

        <Section
          id="v45"
          title="V45 · Centered Cockpit + Drawer"
          chassis="Slim queue, centered hero, collapsible right drawer"
          premise="Hide most context behind a pull tab. The AI summary inside the hero replaces any always-on context block. Drawer Open shows the 3 lead cards when the operator needs them."
          screens={V45_SCREENS}
          colCount={3}
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
  colCount,
}: {
  id: string;
  title: string;
  chassis: string;
  premise: string;
  screens: Screen[];
  colCount: 2 | 3;
}) {
  const previewWidth = colCount === 3 ? Math.round(PREVIEW_W * 0.66) : PREVIEW_W;
  const previewHeight = colCount === 3 ? Math.round(PREVIEW_H * 0.66) : PREVIEW_H;
  const scale = colCount === 3 ? SCALE * 0.66 : SCALE;
  return (
    <section
      id={id}
      className="mt-7 scroll-mt-8 rounded-2xl border border-gray-200 bg-white p-6"
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
        <div className="flex items-center gap-2">
          {screens.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className={`inline-flex h-8 cursor-pointer items-center rounded-lg px-4 text-[12px] font-semibold ${
                s.key === "live"
                  ? "bg-petrol-700 text-white hover:bg-petrol-500"
                  : "bg-white text-petrol-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              }`}
            >
              Open {s.title}
            </Link>
          ))}
        </div>
      </div>

      <p className="mb-4 max-w-[680px] text-[12.5px] leading-relaxed text-gray-600">
        <span className="font-semibold text-ink">Premise:</span> {premise}
      </p>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {screens.map((s) => (
          <div key={s.key}>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              {s.title}
            </div>
            <Link
              href={s.href}
              className="block cursor-pointer overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200 transition-shadow hover:shadow-card-hover"
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
      head: "Hero",
      items: [
        "No tinted boxes. Case-type chip, financial number, and AI summary live on the petrol gradient with no surface; typography weight + opacity + 1px white-at-20% dividers carry the structure.",
        "Status: small green dot + Connected + 04:32 in plain text. No badge background.",
        "Net to Firm $146,132 prominent. Below it in tiny gray: Case L-2026-0218.",
      ],
    },
    {
      head: "Cards",
      items: [
        "Right column (V44) and Drawer (V45) keep white cards on off-white background.",
        "Three cards per surface: Estate Detail, Latest Activity, Contact Tree.",
        "16px internal padding, 8px radius.",
      ],
    },
    {
      head: "Cadence",
      items: [
        "Power dialer. 3s default between disposition and next dial. 0-10s configurable.",
        "Skip always visible and active during the countdown.",
        "Disposition logs during ring time of the next call. Defers if the next connects first.",
      ],
    },
    {
      head: "Wrap Up Morph",
      items: [
        "Hero KEEPS the petrol gradient. No charcoal flip.",
        "Status badge changes to neutral gray Call Ended 04:32.",
        "AI Summary dims to 70% opacity (reference, not active).",
        "Control row replaces in place: Disposition header + How did the call go? + 5 outlined chips + Quick Note input.",
      ],
    },
    {
      head: "Countdown Banner",
      items: [
        "Sticky to top of viewport during wrap up.",
        "Petrol-900 background, white text.",
        "Reads: Next: Otis Crockett · Cousin of Heir · 0:03 · Dial Now · Skip.",
      ],
    },
    {
      head: "Stats + Queue",
      items: [
        "Top stats strip: number + single trend indicator (↑ above pace). Hover reveals session vs 30-day tooltip. Connects pulses on new connect.",
        "Queue header reads 3 of 100 Leads · 47 Dials · 9 Connects · 19% Rate. Search + jump to position on top.",
        "Same Estate · Contact 1 of 4 chip; case_type drives prefix (Estate / Property / Case).",
        "Case Number labeled. Floor never appears.",
      ],
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        Locked Decisions
      </div>
      <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-5">
        {groups.map((g) => (
          <div key={g.head}>
            <div className="text-[11px] font-semibold tracking-tight text-ink">
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
