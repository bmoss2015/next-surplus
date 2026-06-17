import Link from "next/link";
import { SetupA, SetupAStep2, SetupAStep3 } from "../setup-comparison/_components/SetupA";
import { SETUP_CANVAS_W, SETUP_CANVAS_H, DOT_BG } from "../setup-comparison/_components/SetupShared";

export default function SetupAFullPage() {
  return (
    <div className={`min-h-screen ${DOT_BG} bg-[#FAFAFA] px-7 py-7`}>
      <div className="mx-auto" style={{ maxWidth: SETUP_CANVAS_W }}>
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/share/setup-comparison"
            className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
          >
            ← All Approaches
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Option A · Wizard
          </span>
        </div>
        <div className="space-y-7">
          <CanvasShell label="Step 1 · Pick Leads">
            <SetupA />
          </CanvasShell>
          <CanvasShell label="Step 2 · Dialer Behavior">
            <SetupAStep2 />
          </CanvasShell>
          <CanvasShell label="Step 3 · Follow Up Templates">
            <SetupAStep3 />
          </CanvasShell>
        </div>
      </div>
    </div>
  );
}

function CanvasShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        {label}
      </div>
      <div
        className="overflow-hidden rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]"
        style={{ width: SETUP_CANVAS_W, height: SETUP_CANVAS_H }}
      >
        {children}
      </div>
    </div>
  );
}
