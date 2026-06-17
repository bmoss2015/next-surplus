import Link from "next/link";
import { SetupD, SetupDQuestion1 } from "../setup-comparison/_components/SetupD";
import { SETUP_CANVAS_W, SETUP_CANVAS_H, DOT_BG } from "../setup-comparison/_components/SetupShared";

export default function SetupDFullPage() {
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
            Option D · Conversational
          </span>
        </div>
        <div className="space-y-7">
          <CanvasShell label="Question 1 · How Many Leads?">
            <SetupDQuestion1 />
          </CanvasShell>
          <CanvasShell label="Question 2 · What Number to Dial From?">
            <SetupD />
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
