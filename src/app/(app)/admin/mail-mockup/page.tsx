import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Mockup index — three from-scratch redesigns of the mail experience
// for Bree to pick from. Each variant covers both surfaces:
//   - The main /mail "Sent" dashboard (global across leads)
//   - The lead Mail tab (per-record view)
//
// No code reuse from the current /mail or MailTab pages. Hardcoded
// sample data so the designs read cleanly without DB plumbing. Same
// portal color palette but everything else built from blank.
//
// Gated to non-prod + admin. Direct URL only; no nav entry.

export default async function MailMockupIndexPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const variants = [
    {
      slug: "v2",
      label: "Variant 2 — Editorial Card (Revised)",
      blurb:
        "Updated per feedback. Letter thumbnail + recipient details as a card, but the magazine paragraph at top and per-card prose are gone. Top is a clean header with stat numbers. Cards use key/value fields. Tracking number on one line. View Letter, Track, and Fix Address & Resend kept.",
    },
    {
      slug: "v4",
      label: "Variant 4 — Split-Pane Inbox",
      blurb:
        "Email-client pattern (Superhuman / Linear inbox / Apple Mail). Left rail is a dense scannable list of pieces with status dots; right pane shows the selected piece full-detail with letter thumbnail + fields + inline resend form. Built for fast triage when many pieces are in flight.",
    },
    {
      slug: "v5",
      label: "Variant 5 — Timeline / Flow",
      blurb:
        "Each piece is a horizontal bar across a time axis. Solid bar from send date to delivery (or return). In-flight pieces get a striped tail showing the expected arrival window. Today marked by a dashed vertical line. See pipeline shape at a glance, spot pieces stuck longer than expected.",
    },
    {
      slug: "v1",
      label: "Variant 1 — Constellation (rejected)",
      blurb:
        "Original concept. Mail pieces as nodes on a canvas, positioned by date and status. Bree's feedback: too sporadic, hard to read precisely. Kept here for reference only.",
    },
    {
      slug: "v3",
      label: "Variant 3 — Workspace Board (rejected)",
      blurb:
        "Original concept. Three-column kanban (In Transit, Delivered, Needs Attention). Bree's feedback: same as every other CRM, too standard. Kept here for reference only.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Mail Redesign Mockups
        </h1>
        <p className="mt-2 text-[14px] text-gray-600">
          Three from-scratch design variants for the mail experience.
          Each link below opens a full mockup showing both the main
          /mail dashboard and the lead Mail tab in that visual
          language. Pick one (or mix-and-match elements) and the
          chosen direction ships.
        </p>
        <div className="mt-8 space-y-4">
          {variants.map((v) => (
            <Link
              key={v.slug}
              href={`/admin/mail-mockup/${v.slug}`}
              className="block rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-card cursor-pointer"
            >
              <div className="text-[18px] font-semibold text-ink">
                {v.label}
              </div>
              <div className="mt-2 text-[13px] text-gray-600">{v.blurb}</div>
              <div className="mt-3 text-[12px] font-medium text-petrol-600">
                Open mockup →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
