import { IconInbox, IconPlugConnected } from "@tabler/icons-react";
import Link from "next/link";

export function InboxEmptyState({
  hasAccount,
}: {
  hasAccount: boolean;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-[420px] rounded-[10px] border border-gray-200 bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
          <IconInbox size={22} stroke={1.75} />
        </div>
        {hasAccount ? (
          <>
            <h2 className="text-[15px] font-medium text-ink">
              Your Inbox Is Empty
            </h2>
            <p className="mt-2 text-[12px] text-gray-500">
              Once new messages arrive, you&apos;ll see them here. The portal syncs
              your connected account every couple minutes.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[15px] font-medium text-ink">
              Connect An Email Account
            </h2>
            <p className="mt-2 text-[12px] text-gray-500">
              Connect your Gmail to send and receive messages without leaving
              the portal. Each lead&apos;s conversations are pinned to its detail
              page automatically.
            </p>
            <Link
              href="/api/oauth/google/start"
              className="mt-5 inline-flex items-center gap-1 rounded-md btn-primary px-4 py-[8px] text-xs font-medium text-white"
            >
              <IconPlugConnected size={14} stroke={2} />
              Connect Gmail
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
