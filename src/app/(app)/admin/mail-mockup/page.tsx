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
      slug: "v1",
      label: "Variant 1 — Constellation",
      blurb:
        "Mail pieces as nodes on a canvas. Position by date, color by status, size by mail class. Hover anchors detail in a side rail. Visual-first; reads like a research wall, not a spreadsheet.",
    },
    {
      slug: "v2",
      label: "Variant 2 — Editorial",
      blurb:
        "Magazine layout. Bold typographic lead with stats embedded in a sentence, then mail pieces as editorial cards stacked vertically. Each card pairs a letter thumbnail with rich recipient context. Type-first.",
    },
    {
      slug: "v3",
      label: "Variant 3 — Workspace",
      blurb:
        "Three-column workflow board. In Transit, Delivered, Needs Attention. Each piece is a card you can scan vertically by column. Compose action floats at the top. Reads like a project board.",
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
