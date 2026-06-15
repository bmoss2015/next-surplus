import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function DialerMockupIndexPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const variants = [
    {
      slug: "v37",
      title: "V37 — Compact No-Scroll (1280px+ fits)",
      anchor: "V35 spirit, tightened",
      summary:
        "Same three-column structure as V35 (Session Queue left, Call Stage center, Deal Facts + Contacts + Notes right) but every card padding and font size dropped by ~15% so the whole page fits on a 1280px laptop with no scroll. Same V25 live flashing dot, V17 floating shadows, V13 clean separate panels.",
      why: "If 'everything fits on one page' is the priority, this is it. Lose a little breathing room, gain zero scroll across the entire screen.",
    },
    {
      slug: "v36",
      title: "V36 — Wrap-Up State Shown",
      anchor: "V35 layout, wrap-up moment",
      summary:
        "Same skeleton as V35 but showing what happens after End Call. Center column reads: gradient hero with 'Call Just Ended' + note field, then a row of five outcome cards (Interested / Callback / Not Interested / Wrong Number / Do Not Contact), then the white Next Call card with 0:03 countdown and Dial Now.",
      why: "V35 shows the LIVE state (you're talking). V36 shows the WRAP-UP state (after End Call). Same layout, different moment. Pair them to see both modes.",
    },
    {
      slug: "v35",
      title: "V35 — Live Call State (Recommended Starting Point)",
      anchor: "V13 panels + V17 shadows + V25 controls + V29 gradient",
      summary:
        "Session Queue as a full-height left rail (your strongest direction). Smaller centered call card with V25 live flashing dot, V25 mute/hold/voicemail/end controls, V29-style clean gradient with no watermark. White Next Call card below shows the 0:03 countdown and Dial Now. Right rail has three separate floating cards: Deal Facts (county, sale type, sale date, owner status, surplus, net), Contacts and Phones, Recent Notes.",
      why: "This is the consolidated answer to every piece of your last round. No watermark, no white strip at the top, no auto-detected text, no Lead History (redundant with Notes), no rainbow accents. Left queue rail, smaller call card, clear right-rail panels with shadows. Dial Now replaces Skip Wait (clearer phrasing).",
    },
    {
      slug: "v34",
      title: "V34 — Hero-Dominant + Queue Strip",
      anchor: "V28 spine, polished",
      summary:
        "Hero card spans 9 columns and includes the deal headline inline (Hayes Estate · Cuyahoga County · Stage · Attempt 1 of 4) plus a large Net To Firm counter inside the gradient. Right column is a compressed contact tree + recent notes. Session queue runs as a horizontal card strip across the bottom.",
      why: "If you want the call surface to feel cinematic and the queue scannable left-to-right (like a Spotify playlist row), this is the layout. Deal context lives inline with the hero so you never lose it.",
    },
    {
      slug: "v33",
      title: "V33 — Deal Card Up Front",
      anchor: "V28 spine, deal-first",
      summary:
        "Top row is two side-by-side cards: the Deal card (Hayes Estate, property, surplus, net, lead history, tags) and the wrap-up Hero. Below: contact tree, distinct-leads queue, and recent notes side by side. Deal context is the visual anchor on the left.",
      why: "Direct fix for 'who's Cornelius, where is this, what's been said.' The Deal card answers all three before you look at the call. Best for VAs who want lead context as a permanent reference, not a sub-element.",
    },
    {
      slug: "v32",
      title: "V32 — Polished V28 (Recommended)",
      anchor: "V28 spine, refined",
      summary:
        "Hero card on the left with full wrap-up state: countdown + Skip Wait, five outcome buttons with sub-labels (Move to Contract, Schedule a time, etc.), persistent note field at the bottom. Right rail is four small cards: Deal · Contacts · Queue · Notes.",
      why: "The straight refinement of V28. Contact tree cleaned up (compact rows, expand/collapse with active-number counter). Outcomes have descriptive sub-labels so 'Interested' is paired with 'Move to Contract.' This is what I'd ship.",
    },
    {
      slug: "v31",
      title: "V31 — Bottom Action Bar (Outreach pattern)",
      anchor: "Outreach · Salesloft · Aircall",
      summary:
        "Persistent bottom bar morphs with call state. Left = countdown + Skip Wait. Middle = the five outcome buttons. Right = Skip Lead / Snooze Lead. Above it, the hero card occupies the workspace. Right side stack holds the contact tree (with expand/collapse) and the lead-distinct session queue.",
      why: "Outreach and Salesloft use a persistent action bar for exactly this reason: the same physical spot on the screen is where you act, regardless of call state. Skip Lead and Snooze Lead are first-class buttons, not buried.",
    },
    {
      slug: "v30",
      title: "V30 — Step Indicator (Nooks pattern)",
      anchor: "Nooks · Linear product",
      summary:
        "Top of screen shows four steps: Dialing → Connected → Wrap-Up → Next Lead. Current step (Wrap-Up) glows with a 0:03 countdown chip. Workspace below is split: call summary card on the left, wrap-up panel with a thick petrol-500 border on the right (cannot miss it), contacts and queue below.",
      why: "Step indicator was your single biggest ask — 'guidance on what's next.' V30 puts that progress at the very top, persistent across calls. You always know what stage of the call you're in. The bordered wrap-up panel is the visual answer to 'is it a button or a popup.'",
    },
    {
      slug: "v29",
      title: "V29 — Now and Next (Aircall / Salesforce CTI)",
      anchor: "Aircall · Salesforce CTI · Twilio Flex",
      summary:
        "Two cards on the top row. Left card = the call that just ended (dark petrol gradient with outcome buttons inline). Right card = the Next Call preview with a 0:03 countdown, Skip Wait button, then the next lead's avatar and number. Below, contact tree and session queue.",
      why: "Aircall ships this layout. The 'always show what's next' card is the answer to 'I can't tell if the queue is part of the same lead or different ones' — the Next Call card is always one lead away. Skip Wait and Skip This Lead Entirely are both visible without clicking anything.",
    },
    {
      slug: "v28",
      title: "V28 — Inline Transform (Salesloft pattern)",
      anchor: "Salesloft · Modern call hero",
      summary:
        "The single hero card morphs through call states without a modal or drawer. During wrap-up: header pulses, countdown chip shows 0:03, Skip Wait button appears, five outcome buttons fill the lower half, note field below. Same position, different mode. Right column always shows the deal card, contact tree, and short next-leads list.",
      why: "If the V17 hero card was the win, V28 keeps it as the hero forever — it just changes what it's doing. No popup. No drawer. The wrap-up is the same card you were just looking at. Lowest cognitive switch between states.",
    },
    {
      slug: "v27",
      title: "V27 — Wrap-Up Side Drawer",
      anchor: "PhoneBurner · ZoomInfo Engage",
      summary:
        "Three-column. Left = session queue (1 through 10, lead-level). Center = the petrol-gradient hero showing the last call + contact tree with expand. Right = a dedicated wrap-up drawer with the countdown / Skip Wait at the top, outcome buttons, quick-note field, and recent notes for context.",
      why: "PhoneBurner is the disciplined real-estate-style dialer (your customer profile). Their wrap-up sits as a panel, not a modal. V27 borrows that exactly. The session queue on the left is labeled 'lead-level' so 3/10 means three of ten LEADS, not three of ten calls.",
    },
    {
      slug: "v26",
      title: "V26 — Strip Layout (Spotify Home)",
      anchor: "Spotify Home · Apple Music · App Store Today",
      summary:
        "Caller hero in a single large gradient banner across the top. Below it, horizontal scroll strips of cards for contacts, queue, notes. Bottom dock holds call controls and outcomes in one persistent row. Premium app-feel, content reads as a scrollable card show.",
      why: "If V17's spirit was 'depth and bold caller card,' V26 takes that and stacks the supporting info as horizontal strips you can flick through. Multi-phone display lives inside the contact card. Queue is visible as a strip you can scan without leaving the page.",
    },
    {
      slug: "v25",
      title: "V25 — Fintech Dashboard (Stripe / Mercury)",
      anchor: "Stripe Dashboard · Mercury",
      summary:
        "Precise grid with fine borders, pristine white, no glass effects. Hero block with rounded-square avatar, three pillar stats inline below, controls + End Call. Right rail has the full queue (1 through 10). Bottom row is a contacts table with one row per phone number plus a separate outcome panel.",
      why: "V17 had a packed feeling. V25 is the calm-dense option. Fintech aesthetic. Every number, contact, phone, outcome is on one screen, separated by hairlines not boxes. For when 'premium' means 'precise' rather than 'glossy.'",
    },
    {
      slug: "v24",
      title: "V24 — Color Studio (warm color blocks, no tan)",
      anchor: "Headspace · Notion · soft pastel SaaS",
      summary:
        "Light grey-blue background. Hero caller card is petrol gradient with white avatar. Stats are colored pills (mint, sky, lavender, rose) so each metric reads as a distinct cue, not 'four more numbers.' Contact cards take soft tints per role. Outcome panel and queue are calm white cards.",
      why: "Bree said the V17 mesh colors were not her favorite but kept it light. V24 keeps light but uses color to give each piece its own identity. Tan is gone. No mesh. Distinct cues without going visually heavy.",
    },
    {
      slug: "v23",
      title: "V23 — Typographic (Linear)",
      anchor: "Linear · Vercel docs · Apple typography",
      summary:
        "Single large center column with a strong typographic hierarchy. 64px display name, mid-weight stats divided by hairlines, contacts as a clean grid. No shadows, no glass, no boxes. The depth comes from spacing and weight. Right rail holds controls, outcome, queue, property facts.",
      why: "If V17 won on 'big bold caller card,' V23 takes that to its logical conclusion: type IS the design. Quietest direction in the set. For when you want the dialer to feel like a Linear product instead of a CRM.",
    },
    {
      slug: "v22",
      title: "V22 — Modern Editorial (Apple News+)",
      anchor: "Apple News+ · Bloomberg Edit · NYT Magazine",
      summary:
        "Two large rounded cards on the top row: hero caller (with display serif name) on the left, surplus + outcome panel on the right with an ink-black 'Net to Firm' callout. Bottom row is contacts and notes. Right rail is the full queue with avatars and progress.",
      why: "Magazine LAYOUT not magazine FEEL (Bree shot down V19 newspaper). V22 borrows the Apple News+ grid and serif display for the lead name but stays modern. Outcome panel calls itself 'How Did The Call Go?' instead of 'End With A Disposition.'",
    },
    {
      slug: "v21",
      title: "V21 — Floating Cards (Vercel / Stripe marketing)",
      anchor: "Vercel marketing · Stripe marketing · Notion 2026",
      summary:
        "Pure white background, four rounded cards floating at different shadow depths. Hero card on top with avatar + display name + controls + outcome buttons in one row. Surplus card top-right with an ink-on-petrol Net To Firm callout. Contacts card with multi-phone display (active, dead, last-attempt all visible). Side column for queue and notes.",
      why: "V17 used glassmorphism for depth. V21 uses rich layered shadows instead. Lighter, cleaner, no gradient mesh, no violet. Every important field is its own card with its own shadow tier so 'everything looked the same' becomes 'everything has its own weight.'",
    },
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
