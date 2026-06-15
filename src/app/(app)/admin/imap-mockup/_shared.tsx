"use client";

import Link from "next/link";

export function MockupShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
            IMAP Modal Mockups
          </div>
          <div className="flex items-center gap-4 text-[12px] text-gray-600">
            {["v1", "v2", "v3", "v4", "v5"].map((v) => (
              <Link
                key={v}
                href={`/admin/imap-mockup/${v}`}
                className={
                  v === active
                    ? "font-semibold text-[#0d4b3a]"
                    : "hover:text-ink"
                }
              >
                {v.toUpperCase()}
              </Link>
            ))}
            <Link
              href="/admin/imap-mockup"
              className="ml-2 text-gray-400 hover:text-ink"
            >
              Index
            </Link>
          </div>
        </div>
      </div>
      <div className="flex min-h-[calc(100vh-49px)] items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}

export const PRESETS = [
  { label: "Fastmail", host: "imap.fastmail.com" },
  { label: "iCloud", host: "imap.mail.me.com" },
  { label: "Zoho", host: "imap.zoho.com" },
  { label: "Yahoo", host: "imap.mail.yahoo.com" },
];
