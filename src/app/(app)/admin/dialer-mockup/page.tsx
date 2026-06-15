import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function DialerMockupIndexPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const variants = [
    {
      slug: "v1",
      title: "V1 — Editorial Focus",
      anchor: "Linear · Stripe Press · Superhuman",
      summary:
        "Single column, magazine layout. Lead name as a 56px headline, sale info as a sub deck, contacts as a portrait cluster. Call dock peeks from the bottom edge. End Call slides a disposition ribbon across the screen, no modal. Keyboard shortcut on every action.",
      why: "Aircall reviewers consistently praise the clean, low-click flow. Linear and Superhuman set the bar for typographic focus. Removes the disposition modal that interrupts the call rhythm.",
    },
    {
      slug: "v2",
      title: "V2 — Constellation Cockpit",
      anchor: "Attio · Affinity · Outreach",
      summary:
        "Lead's contact graph is the page. Primary owner sits at the center of a constellation, heirs and relatives orbit. Currently dialed contact pulses. The call surface lives below the graph, with an editorial activity feed on the right. Dispositions inline at the bottom as ribbon cues.",
      why: "Surplus funds work is relationship-heavy (heirs of an estate, multiple co-owners). Affinity sells on this. Attio's visual richness is the upgrade path away from standard CRM tables. No hex tiles, no dot+caps chips.",
    },
    {
      slug: "v3",
      title: "V3 — Workspace Doc",
      anchor: "Notion · Roam · Superhuman",
      summary:
        "Reads like a structured document about the lead. H1 owner name, H2 property, body paragraphs describing surplus + owners, contacts as inline mini cards, notes as blockquotes. Call dock pinned to the right edge, always visible. Cmd+K opens a command palette for disposition + actions.",
      why: "Notion-style docs scale to any amount of context without feeling cluttered. Bree's complaint about other CRMs is panel-fatigue. This direction eliminates panels by letting the lead itself BE the page.",
    },
    {
      slug: "v4",
      title: "V4 — Heatmap Workboard",
      anchor: "Bloomberg Terminal · Slack · PhoneBurner discipline",
      summary:
        "Left rail = queue list. Center = a big day-by-hour heatmap of best contact times based on past attempts and answer rate. Right rail = call controls + lead micro card + disposition tiles. The matrix is the visual anchor. Picks the next call slot from data instead of guessing.",
      why: "Bloomberg-grade density without feeling like a generic dashboard. The heatmap is the kind of visualization no other dialer offers, and it directly answers 'when should I call this person.' Plays to the surplus-funds reality that people pick up at predictable windows.",
    },
    {
      slug: "v5",
      title: "V5 — Parallel Power",
      anchor: "Nooks · Orum · Mission Control",
      summary:
        "Multi-line. 2×2 grid of compact call cards when dialing four numbers at once. The card that connects expands to take the workspace, the others gray-pause. Side rail shows queue burn down. Single-line power mode is a switch.",
      why: "Nooks beats Orum on UI but Orum still leads on parallel dial volume. This direction borrows Nooks' calm visual layer over Orum's productivity ceiling. Future-proof: ships as power dial in V1, parallel ready when telephony supports it.",
    },
    {
      slug: "v6",
      title: "V6 — Property Map Workspace",
      anchor: "Zillow · Apple Find My · Notion spatial",
      summary:
        "Map of the subject property fills the backdrop. Property card pinned top-left, surplus badge top-right, call surface and people strip pinned to the bottom. Disposition row inline. The property is the hero, not the person.",
      why: "Surplus work is property-anchored. Most dialers treat each call as a contact-row event; the geography never shows. A spatial backdrop reframes the work and makes the asset undeniable, which is the right frame for high-value leads.",
    },
    {
      slug: "v7",
      title: "V7 — Inbox Triage",
      anchor: "Superhuman · Hey · Front",
      summary:
        "Three pane email-app layout. Left rail is the queue as a thread list. Center is the lead as one threaded conversation, every call / mail / voicemail / note as a message bubble. Right rail is decide + snooze. Active call pinned as a thin bar above the dock.",
      why: "Superhuman is the speed bar reviewers still cite as the gold standard. Treating a lead as a single conversation thread eliminates the panel fatigue Bree keeps calling out, and snooze fits surplus work where 'call back Tuesday' is the most common outcome.",
    },
    {
      slug: "v8",
      title: "V8 — Card Deck Focus",
      anchor: "Tinder · Linear cycle · Apple Photos",
      summary:
        "One lead, edge to edge, on a dark stage. Two ghost cards stacked behind to telegraph the queue. Keyboard cycles J/K, decisions are C/D/S/X. Everything that's not this lead is hidden. Bottom bar shows the four big keys.",
      why: "Power dialing is decision fatigue. Every other direction shows a queue, a sidebar, a map. This one shows the next decision and nothing else. Closest analog is a Tinder deck or Apple Photos full-screen review, scaled to a working surface.",
    },
    {
      slug: "v9",
      title: "V9 — Mission Briefing",
      anchor: "Notion AI Canvas · CIA dossier · Classic newspaper",
      summary:
        "Cream paper, serif type. The lead presented as a prepared briefing with numbered sections: TL;DR, Key Facts, Open Questions, Suggested Opening, Risks, People. Call strip pinned at the foot. No data tables, no panels — only synthesized intelligence.",
      why: "Bree keeps rejecting dashboard chrome. This direction strips it entirely and treats every call as a prepared briefing the analyst delivers before the rep dials. Heavy serif, no chips, no tinted backgrounds. Editorial confidence as the visual language.",
    },
    {
      slug: "v10",
      title: "V10 — Voice Co-Pilot",
      anchor: "Otter.ai · Gong · Granola · ChatGPT Voice",
      summary:
        "Live transcript center stage. Rep bubbles right, lead bubbles left, AI cues inline as flagged notes. Right rail = co-pilot suggestions (say-now / avoid / ask) + flagged moments (objections, commitments). Left rail = lead context. Dock pinned at the bottom.",
      why: "No surplus-specialized dialer ships an AI co-pilot today. Reps in this market spend the call balancing siblings, fee objections, and probate timelines. Real-time transcription + targeted cue cards is the highest-leverage feature once telephony lands.",
    },
  ];

  return (
    <div className="mx-auto max-w-[920px] px-7 py-10">
      <header className="mb-9">
        <div className="text-[11px] uppercase tracking-[0.4px] text-gray-500">
          Internal Mockup Set
        </div>
        <h1 className="m-0 mt-1 text-[34px] font-medium tracking-tight text-ink">
          Dialer Design Exploration
        </h1>
        <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-gray-500">
          Five distinct directions for the surplus-funds dialer. Each is anchored
          in patterns from the dialers reviewers praise (Aircall, Nooks,
          PhoneBurner, Salesloft) and the visual references Bree picked for the
          rest of the portal (Attio, Affinity, Linear, Superhuman). Pick one or
          mix.
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

      <footer className="mt-10 border-t border-gray-200 pt-6 text-[12px] leading-relaxed text-gray-500">
        Anchors live in the description on each card. Telephony, recording, and
        live transcription are noted where the design depends on them but no
        integration is wired up yet. Notes, surplus, and contact data are sample
        copy on one composite lead so the visual comparison stays honest.
      </footer>
    </div>
  );
}
