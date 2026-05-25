import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { MailTestClient } from "./_components/MailTestClient";

// Staging-only mail-send harness. Gated to non-prod Vercel envs so it
// can never render in production. Admin only on top of that.
export default async function MailTestPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();
  if (!profile.isAdmin) notFound();

  return (
    <div className="px-6 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">
          Mail Send Harness
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          Exercises every Send Mail scenario end to end against the staging
          stack. Each row hits the same server action the Send Mail modal
          uses, then collects the resulting mail_jobs, activities, and
          notification rows for inspection. Run All sequences every scenario
          back to back.
        </p>
      </header>
      <MailTestClient />
    </div>
  );
}
