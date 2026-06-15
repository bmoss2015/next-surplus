import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function DialerMockupIndexPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const variants = [
    {
      slug: "v20",
      title: "V20 — Family Tree (the visual you wanted from V2)",
      anchor: "Genealogy mapped, modern",
      summary:
        "The estate sits at the top, the primary owner below it, heirs branch from there. Connected contact glows along the line that is on the call. Side rail shows surplus, AI brief. Dispositions stretch full width along the bottom. Light theme.",
      why: "V2 had a compass that did not read as 'family.' V20 draws an actual tree, decedent at top, estate below, heirs side by side. Probate cases ARE family trees, so the chart and the work line up. Strikethrough wrong numbers, dim relatives not in contact.",
    },
    {
      slug: "v19",
      title: "V19 — Focus Mode (calm, monk-mode)",
      anchor: "Headspace · Calm · Linear (calm)",
      summary:
        "Off-cream paper, no chrome, big light-weight display type. One column. Contact name as a 80px display headline, surplus to the right as a counter-balance. AI brief flows below as plain editorial. Bottom strip is the dispositions as a quiet row.",
      why: "The other directions have packed every pixel. This one strips back. Heavy negative space, no panels, no boxes. The work IS the call, everything else is supporting prose. For when you want the dialer to feel premium and decisive instead of busy.",
    },
    {
      slug: "v18",
      title: "V18 — Studio Workstation (Figma feel)",
      anchor: "Figma · Notion · Linear",
      summary:
        "Top toolbar with controls + counters. Left layers panel (Active Lead / Up Next / Done Today). Center canvas with the lead as the work surface (display headline, AI brief as a centered card, contact mini-cards below). Right inspector with surplus / property / disposition / quick note. Light, every panel has a different shape.",
      why: "Bree said the others had 'no variation, everything looks the same.' V18 borrows the Figma three-pane app shell so the rail, canvas, and inspector each have their own visual treatment. Hierarchy is built into the shell itself.",
    },
    {
      slug: "v17",
      title: "V17 — Glass Bento (Apple Vision Pro / Linear marketing)",
      anchor: "Apple Vision Pro · Linear marketing · Stripe",
      summary:
        "Soft tri-color gradient mesh background. Floating glass cards with real shadows at multiple depths. Big call card center-left, AI brief top-right, surplus mid-right, contacts as portrait cluster bottom-left, dispositions strip at the foot. Light, premium, layered.",
      why: "Bree said V11-V15 felt flat. V17 leans hard into depth: glassmorphism, gradient backgrounds, soft shadows, blur. The same content, but presented as floating layers instead of stacked tiles. Modern premium SaaS aesthetic.",
    },
    {
      slug: "v16",
      title: "V16 — Hero Stage (Spotify Now Playing)",
      anchor: "Spotify · Apple Music · Editorial covers",
      summary:
        "Two columns. Left 60% is the hero: contact name as a 80px display headline, watermark initials behind, big talk time, contact cluster across the bottom. Right 40% is the detail column with surplus headline, AI brief, queue. Bottom dock has all controls and dispositions in one row. Warm off-white background, no glass, no boxes on the hero.",
      why: "Bree said important info got 'muted' in V11. V16 inverts that. The hero side has nothing competing with the contact name and the talk time. The detail side is calm and scannable. Spotify and Apple Music nailed this composition for a different domain. Translated cleanly here.",
    },
    {
      slug: "v15",
      title: "V15 — All In View Dashboard",
      anchor: "Nooks frame · Pipedrive uncluttered",
      summary:
        "Tile grid, no scroll. Top strip = six labeled session stats. Center row = call card + AI brief + contacts. Bottom strip = dispositions and a horizontal queue ribbon. Light, single line.",
      why: "Bree's feedback: V1 info disappeared at the bottom. V15 puts everything on one screen with zero scroll. Each tile is scannable, the active call card is the visual hero, dispositions stretch full width so they're impossible to miss.",
    },
    {
      slug: "v14",
      title: "V14 — Parallel Done Right",
      anchor: "Nooks parallel · V5 fixed",
      summary:
        "Dark, four-line grid. Each line card labels who is being called (Calling Heir / Calling Primary Owner) so the VA never wonders. Connected line shows controls + timer; ringing lines stay compact; voicemail-detected mutes. AI brief docks for the active line.",
      why: "Bree's feedback on V5: the multi-line grid was the favorite, but it was unclear who was on the other end and what 'burn down' meant. V14 fixes both: explicit role labels per line, named stats only (Dials / Connects / Connect Rate / Avg Talk Time).",
    },
    {
      slug: "v13",
      title: "V13 — Dark Command Bridge",
      anchor: "Nooks · V5 palette fixed",
      summary:
        "Single line. Dark theme but petrol-only palette (no violet). Session header with four labeled stats. Big active call card with role badge, talk time, mute / hold / voicemail / end. AI brief panel on the right, queue rail far right.",
      why: "Bree's feedback on V5: liked the dark theme, did not like the violet clashing with green. V13 keeps the dark but commits to the brand petrol. Same content structure as V11, alternate skin.",
    },
    {
      slug: "v12",
      title: "V12 — Command Bridge With Constellation",
      anchor: "Nooks frame · V2 visual win",
      summary:
        "Light, single line. Same layout as V11 but the right panel renders contacts as a constellation around the estate, the connected contact glowing. Brief sits above the constellation.",
      why: "Bree liked V2's relationship visual ('pretty cool'). V12 keeps that visual but plants it inside a real dialer frame, with the AI brief above so the VA reads the summary before scanning the graph.",
    },
    {
      slug: "v11",
      title: "V11 — Command Bridge (Recommended Baseline)",
      anchor: "Nooks",
      summary:
        "Light, single line. Session header (Dials / Connects / Connect Rate / Avg Talk Time, each labeled). Active call card centered with role badge, talk time, four controls + End Call. AI brief on the right. Queue rail far right. Multi-line toggle in the header off by default.",
      why: "The recommended starting point. Combines the wins Bree called out (clear who is calling, role badge, AI brief, labeled stats, queue visible) into the canonical Nooks layout. Multi-line is one click away when telephony supports it.",
    },
    {
      slug: "v10",
      title: "V10 — Voice Co-Pilot",
      anchor: "Otter.ai · Gong · Granola",
      summary:
        "Live transcript center stage. Rep bubbles right, lead bubbles left, AI cues inline. Right rail = say-now / avoid / ask suggestions and flagged moments.",
      why: "Earlier exploration. Bree read this as a conversation thread and rejected it.",
    },
    {
      slug: "v9",
      title: "V9 — Mission Briefing",
      anchor: "Notion AI Canvas · CIA dossier",
      summary:
        "Cream paper, serif headlines. The lead presented as a prepared briefing with numbered sections: TL;DR, Key Facts, Open Questions, Suggested Opening, Risks, People.",
      why: "Earlier exploration. Bree called this 'terrible, looks like the newspaper'.",
    },
    {
      slug: "v8",
      title: "V8 — Card Deck Focus",
      anchor: "Tinder · Linear cycle",
      summary:
        "One lead, edge to edge, dark stage. Ghost cards stacked behind. Keyboard cycles J/K, decisions C/D/S/X. AI summary card on the right of the lead card.",
      why: "Earlier exploration. Bree liked the AI summary panel but said the C/D/S/X shortcuts were too coded and there was too much scroll.",
    },
    {
      slug: "v7",
      title: "V7 — Inbox Triage",
      anchor: "Superhuman · Hey · Front",
      summary:
        "Three pane email-app layout. Lead reads as one threaded conversation, every call / mail / voicemail / note as a message.",
      why: "Earlier exploration. Bree read this as a conversation thread and rejected it.",
    },
    {
      slug: "v6",
      title: "V6 — Property Map Workspace",
      anchor: "Zillow · Apple Find My",
      summary:
        "Subject property fills the canvas as a parcel map. Property card top-left, surplus top-right, call surface and people strip docked at the bottom.",
      why: "Earlier exploration. Bree rejected the map as not useful.",
    },
    {
      slug: "v5",
      title: "V5 — Parallel Power (first take)",
      anchor: "Nooks · Orum · Mission Control",
      summary:
        "Multi-line 2x2 grid of compact call cards. The card that connects expands, the others gray-pause. Side rail = session stats and queue.",
      why: "Earlier exploration. Bree loved the multi-line grid but said it lacked role labels, used violet that clashed with green, and the 'burn down' label was confusing. V14 is the refined version.",
    },
    {
      slug: "v4",
      title: "V4 — Heatmap Workboard",
      anchor: "Bloomberg Terminal · Slack",
      summary:
        "Day-by-hour heatmap of best contact times, queue rail on the left, call controls on the right.",
      why: "Earlier exploration. Bree pointed out VAs follow owner-set calling hours, so the heatmap isn't decision-grade for them.",
    },
    {
      slug: "v3",
      title: "V3 — Workspace Doc",
      anchor: "Notion · Roam · Superhuman",
      summary:
        "Reads like a structured document about the lead. H1 owner name, H2 property, embedded contact cards, blockquote notes, timeline at the foot. Call dock pinned to the right edge.",
      why: "Earlier exploration. Bree said this 'gives document, not dialer'. Rejected.",
    },
    {
      slug: "v2",
      title: "V2 — Constellation Cockpit",
      anchor: "Attio · Affinity · Outreach",
      summary:
        "SVG constellation of contacts around the estate at the center. Call surface below, editorial activity feed on the right.",
      why: "Earlier exploration. Bree liked the constellation visual and the call surface but said the activity feed should be notes instead. V12 picks up the visual win.",
    },
    {
      slug: "v1",
      title: "V1 — Editorial Focus",
      anchor: "Linear · Stripe Press · Superhuman",
      summary:
        "Single column magazine layout, big headline, lead narrative as prose, contacts as a portrait cluster, call dock peeks from the bottom.",
      why: "Earlier exploration. Bree liked the portrait cluster with the active highlight but said the page scrolled too much and the bottom dock disappeared. The portrait cluster carries forward.",
    },
  ];

  return (
    <div className="mx-auto max-w-[920px] px-7 py-10">
      <header className="mb-9">
        <div className="text-[11px] uppercase tracking-[0.4px] text-gray-500">
          Internal Mockup Set · Newest First
        </div>
        <h1 className="m-0 mt-1 text-[34px] font-medium tracking-tight text-ink">
          Dialer Design Exploration
        </h1>
        <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-gray-500">
          Anchored on Nooks for the dialer surface and PhoneBurner for one-call
          discipline. V11 is the recommended baseline. V12 swaps in the
          constellation, V13 darkens, V14 is the multi-line refinement of V5,
          V15 fits everything on one zero-scroll dashboard. Earlier exploration
          (V1 to V10) listed below for reference.
        </p>
      </header>

      <div className="space-y-3">
        {variants.map((v) => (
          <Link
            key={v.slug}
            href={`/admin/dialer-mockup/${v.slug}`}
            className="group block rounded-lg border border-gray-200 bg-surface px-6 py-5 transition-colors hover:border-petrol-500"
          >
            <div className="flex items-baseline justify-between gap-6">
              <div className="min-w-0">
                <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
                  {v.anchor}
                </div>
                <h2 className="m-0 mt-1 text-[20px] font-medium tracking-tight text-ink">
                  {v.title}
                </h2>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-petrol-500 group-hover:underline">
                Open →
              </span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-gray-700">
              {v.summary}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
              <span className="font-medium text-ink">Why:</span> {v.why}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
