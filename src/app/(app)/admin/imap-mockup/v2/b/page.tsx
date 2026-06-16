import { notFound } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { MockupShell } from "../../_shared";
import { V2Body } from "../_body";
import { V2VariantNav } from "../_nav";

export default async function V2B() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <MockupShell active="v2">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]">
        {/* B: Quiet wordmark + close, no color block */}
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-3.5">
          <div className="text-[12.5px] font-semibold tracking-tight text-ink">
            Next Surplus
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-ink">
            <IconX size={16} stroke={2} />
          </button>
        </div>
        <V2Body />
      </div>
      <V2VariantNav active="b" />
    </MockupShell>
  );
}
