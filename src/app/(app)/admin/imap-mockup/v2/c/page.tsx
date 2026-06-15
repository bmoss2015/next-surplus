import { notFound } from "next/navigation";
import { IconX, IconMail } from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { MockupShell } from "../../_shared";
import { V2Body } from "../_body";
import { V2VariantNav } from "../_nav";

export default async function V2C() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <MockupShell active="v2">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]">
        {/* C: Brand-dark strip, small mark + label, close on right */}
        <div className="flex items-center justify-between bg-[#0a3d4a] px-5 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <IconMail size={14} stroke={2} />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]">
              Connect Email Account
            </span>
          </div>
          <button className="flex h-6 w-6 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white">
            <IconX size={14} stroke={2.2} />
          </button>
        </div>
        <V2Body />
      </div>
      <V2VariantNav active="c" />
    </MockupShell>
  );
}
