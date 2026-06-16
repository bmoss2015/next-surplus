import { notFound } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { MockupShell } from "../../_shared";
import { V2Body } from "../_body";
import { V2VariantNav } from "../_nav";

export default async function V2A() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <MockupShell active="v2">
      <Card>
        {/* A: Hairline brand-gradient accent across the top */}
        <div
          className="h-1"
          style={{
            background:
              "linear-gradient(90deg, #0a3d4a 0%, #0d6c7d 60%, #1a8a9c 100%)",
          }}
        />
        <div className="absolute right-3 top-3">
          <CloseBtn />
        </div>
        <V2Body />
      </Card>
      <V2VariantNav active="a" />
    </MockupShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]">
      {children}
    </div>
  );
}

function CloseBtn() {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-ink">
      <IconX size={16} stroke={2} />
    </button>
  );
}
