import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

export const metadata = { title: "IMAP Modal Mockups" };

const VARIANTS = [
  {
    slug: "v1",
    anchor: "Stripe Connect",
    summary:
      "Centered header with brand-icon block, vertical sections divided by hairlines, segmented SSL toggle, switch for reuse-creds. This is the current shipped design.",
  },
  {
    slug: "v2",
    anchor: "Plaid Link",
    summary:
      "Three-step vertical wizard. One decision per step: pick provider → enter email/password → confirm. Big buttons, very mobile-friendly.",
  },
  {
    slug: "v3",
    anchor: "Linear",
    summary:
      "Dark mode header with monospace accents, dense single-page form, sharp angles, minimal whitespace, command-palette feel.",
  },
  {
    slug: "v4",
    anchor: "Notion Connect",
    summary:
      "Two-pane modal. Provider list with logos on the left, credential form on the right. Click a provider, the form pre-fills.",
  },
  {
    slug: "v5",
    anchor: "Apple Mail",
    summary:
      "Provider grid as the first screen. Click a provider, the modal transitions to a credential form for just that provider. Sheet-style animation.",
  },
];

export default async function ImapMockupIndex() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="m-0 mb-2 text-[28px] font-semibold tracking-tight text-ink">
        IMAP Modal Mockups
      </h1>
      <p className="mb-8 text-[14px] text-gray-500">
        Five distinct directions for the Connect Other (IMAP) modal,
        each anchored on a well-designed connect/credential UX. Click
        each to open the live modal version.
      </p>
      <div className="space-y-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/admin/imap-mockup/${v.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-5 hover:border-petrol-300"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[15px] font-semibold tracking-tight text-ink">
                  {v.slug.toUpperCase()} — {v.anchor}
                </div>
                <div className="mt-1 text-[13px] leading-relaxed text-gray-600">
                  {v.summary}
                </div>
              </div>
              <div className="text-[12px] text-petrol-500">Open →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
