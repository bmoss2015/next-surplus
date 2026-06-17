import Link from "next/link";
import { SetupC } from "../setup-comparison/_components/SetupC";
import { SETUP_CANVAS_W, SETUP_CANVAS_H, DOT_BG } from "../setup-comparison/_components/SetupShared";

export default function SetupCFullPage() {
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
            Option C · Single Page Hierarchy
          </span>
        </div>
        <div
          className="overflow-hidden rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]"
          style={{ width: SETUP_CANVAS_W, height: SETUP_CANVAS_H }}
        >
          <SetupC />
        </div>
      </div>
    </div>
  );
}
