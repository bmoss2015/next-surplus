import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  fetchInboxThreads,
  fetchThreadDetail,
  fetchInboxFilterCounts,
  type InboxFilter,
} from "@/lib/email/inbox";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { ThreadList } from "./_components/ThreadList";
import { ThreadReader } from "./_components/ThreadReader";
import { InboxEmptyState } from "./_components/InboxEmptyState";
import { FilterEmptyState } from "./_components/FilterEmptyState";

export const dynamic = "force-dynamic";

const VALID_FILTERS: InboxFilter[] = [
  "all",
  "unread",
  "email",
  "sms",
  "unlinked",
];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const sp = await searchParams;
  const filter: InboxFilter =
    typeof sp.filter === "string" && VALID_FILTERS.includes(sp.filter as InboxFilter)
      ? (sp.filter as InboxFilter)
      : "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const selectedId = typeof sp.c === "string" ? sp.c : null;

  const [accounts, threads, detail, counts] = await Promise.all([
    fetchMyEmailAccounts(),
    fetchInboxThreads({ filter, q }),
    selectedId ? fetchThreadDetail(selectedId) : Promise.resolve(null),
    fetchInboxFilterCounts(),
  ]);

  const hasAccount = accounts.length > 0;
  const selfAddresses = accounts.map((a: { address: string }) => a.address);

  if (!hasAccount) {
    return (
      <div className="h-full">
        <InboxEmptyState hasAccount={false} />
      </div>
    );
  }

  const accountForReader = detail
    ? accounts.find((a: { id: string }) => a.id === detail.channel_account_id)
    : null;

  return (
    <div className="flex h-full">
      <ThreadList
        rows={threads}
        filter={filter}
        q={q}
        selectedId={selectedId}
        selfAddresses={selfAddresses}
        counts={counts}
      />
      {detail && accountForReader ? (
        <ThreadReader
          detail={detail}
          accountAddress={accountForReader.address}
        />
      ) : threads.length === 0 ? (
        <FilterEmptyState filter={filter} q={q} />
      ) : (
        <div className="flex h-full flex-1 items-center justify-center bg-canvas text-[12px] text-gray-500">
          Select a conversation to read.
        </div>
      )}
    </div>
  );
}
