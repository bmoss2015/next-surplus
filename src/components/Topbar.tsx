import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";

export function Topbar() {
  return (
    <header className="flex items-center justify-end gap-2 border-b border-gray-200 bg-surface px-6 py-[14px]">
      <NotificationBell />
      <Link
        href="/imports"
        className="inline-flex items-center gap-[6px] rounded-md btn-primary px-3 py-2 text-xs font-medium text-white transition-colors"
      >
        <IconPlus size={13} stroke={2} />
        Import Leads
      </Link>
    </header>
  );
}
