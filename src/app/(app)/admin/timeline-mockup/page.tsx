import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { StageStripPreview } from "./_components/StageStripPreview";

// Mockup page for the adaptive stage progression strip on the lead detail
// page. Previews all three density modes with synthetic stage lists so we can
// see how the strip behaves as users add, remove, or rename pipeline stages.

export default async function TimelineMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
      <header>
        <h1 className="text-[20px] font-semibold text-ink">
          Adaptive Lead-Detail Stage Strip — Mockup
        </h1>
        <p className="mt-1 text-[12.5px] text-gray-500">
          The Horizontal Stage Strip At The Top Of A Lead Detail Page Picks A
          Layout Based On How Many Stages The Pipeline Has. Below Are All Three
          Modes With Synthetic Stage Lists.
        </p>
      </header>

      <StageStripPreview />
    </div>
  );
}
