"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top-of-page tab bar shared by every route under /mail. The sidebar
// keeps a single "Mail" entry; within the section we use page-level
// tabs to switch between Outbox (status of sent jobs) and Templates
// (authoring). New subsections (Campaigns, Reports) plug in here when
// they exist.
const TABS = [
  { label: "Sent", href: "/mail" },
  { label: "Templates", href: "/mail/templates" },
];

export function MailSectionTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-4 border-b border-gray-200">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/mail"
              ? pathname === "/mail"
              : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-[12px] font-medium transition-colors ${
                active
                  ? "border-petrol-600 text-petrol-700"
                  : "border-transparent text-gray-500 hover:text-petrol-600"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
