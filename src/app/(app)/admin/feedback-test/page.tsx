import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FeedbackEmailTestClient } from "./_client";

export const dynamic = "force-dynamic";

export default async function FeedbackEmailTestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.canViewFeedback) redirect("/");

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Test Harness
        </div>
        <h1 className="mt-1 text-[24px] font-semibold text-ink">
          Feedback Email Preview
        </h1>
        <p className="mt-2 max-w-[60ch] text-[13.5px] text-gray-600">
          One click sends a fully formatted sample feedback email so you can
          see the threaded reply template without setting up a real ticket
          round trip. Both buttons use the exact same renderer the live system
          uses.
        </p>
      </div>
      <FeedbackEmailTestClient />
    </div>
  );
}
