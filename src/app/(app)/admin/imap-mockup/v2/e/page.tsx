import { notFound } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { MockupShell } from "../../_shared";
import { V2Body } from "../_body";
import { V2VariantNav } from "../_nav";

export default async function V2E() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <MockupShell active="v2">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]">
        {/* E: No header at all — floating close button over the body */}
        <button className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-400 shadow-sm backdrop-blur hover:text-ink">
          <IconX size={16} stroke={2} />
        </button>
        <V2Body />
      </div>
      <V2VariantNav active="e" />
    </MockupShell>
  );
}
