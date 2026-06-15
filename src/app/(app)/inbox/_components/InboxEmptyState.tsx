"use client";

import { useState } from "react";
import { IconInbox } from "@tabler/icons-react";
import { ConnectImapModal } from "@/app/(app)/settings/_components/ConnectImapModal";

export function InboxEmptyState({
  hasAccount,
}: {
  hasAccount: boolean;
}) {
  const [imapOpen, setImapOpen] = useState(false);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-[460px] rounded-[10px] border border-gray-200 bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
          <IconInbox size={22} stroke={1.75} />
        </div>
        {hasAccount ? (
          <>
            <h2 className="text-[15px] font-medium text-ink">
              Your Inbox Is Empty
            </h2>
            <p className="mt-2 text-[12px] text-gray-500">
              Once new messages arrive, you&apos;ll see them here. The
              portal syncs your connected account every couple minutes.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[15px] font-medium text-ink">
              Connect An Email Account
            </h2>
            <p className="mt-2 text-[12px] text-gray-500">
              Pick your provider to start syncing messages. Each
              lead&apos;s conversations pin to its detail page
              automatically.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <a
                href="/api/oauth/google/start"
                className="inline-flex h-9 w-36 items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
              >
                Connect Gmail
              </a>
              <a
                href="/api/oauth/microsoft/start"
                className="inline-flex h-9 w-36 items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
              >
                Connect Outlook
              </a>
              <button
                type="button"
                onClick={() => setImapOpen(true)}
                className="inline-flex h-9 w-36 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
              >
                Other (IMAP)
              </button>
            </div>
            <ConnectImapModal
              open={imapOpen}
              onClose={() => setImapOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
