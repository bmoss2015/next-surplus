import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { DialerSetupWizard } from "../_components/DialerSetupWizard";

export const dynamic = "force-dynamic";

type ListOption = {
  id: string;
  name: string;
  count: number;
  source: "import" | "saved" | "all";
  meta?: string;
};

export default async function DialerSetupPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isOwner) notFound();

  const sb = await createClient();

  const [allCountRes, importsRes, savedListsRes, resumeRes] = await Promise.all([
    sb.from("leads").select("id", { count: "exact", head: true }),
    sb
      .from("imports")
      .select("id, filename, uploaded_at, imported_count")
      .eq("status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(50),
    sb
      .from("saved_lists")
      .select("id, name, filter_json, last_run_at")
      .order("last_run_at", { ascending: false, nullsFirst: false })
      .limit(50),
    sb
      .from("dialer_sessions")
      .select("id, list_filter_snapshot, lead_ids, current_cursor, paused_at, status")
      .eq("user_id", profile.id)
      .eq("status", "paused")
      .order("paused_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const allCount = allCountRes.count ?? 0;

  const options: ListOption[] = [
    { id: "all", name: "All Leads", count: allCount, source: "all" },
    ...(importsRes.data ?? []).map((r) => ({
      id: `import:${r.id as string}`,
      name: (r.filename as string) ?? "Untitled Import",
      count: (r.imported_count as number) ?? 0,
      source: "import" as const,
      meta: `Imported ${formatShortDate(r.uploaded_at as string)}`,
    })),
    ...(savedListsRes.data ?? []).map((r) => ({
      id: `saved:${r.id as string}`,
      name: r.name as string,
      count: extractCount(r.filter_json as Record<string, unknown> | null),
      source: "saved" as const,
    })),
  ];

  const resumeSession = resumeRes.data
    ? {
        id: resumeRes.data.id as string,
        list_name:
          ((resumeRes.data.list_filter_snapshot as Record<string, unknown> | null)?.list_name as string | undefined) ??
          "Previous Session",
        remaining: Math.max(
          0,
          ((resumeRes.data.lead_ids as string[] | null)?.length ?? 0) -
            ((resumeRes.data.current_cursor as number | null) ?? 0)
        ),
        paused_at: resumeRes.data.paused_at as string | null,
      }
    : null;

  return <DialerSetupWizard options={options} resumeSession={resumeSession} />;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function extractCount(filterJson: Record<string, unknown> | null): number {
  if (!filterJson) return 0;
  const c = filterJson.lead_count;
  return typeof c === "number" ? c : 0;
}
