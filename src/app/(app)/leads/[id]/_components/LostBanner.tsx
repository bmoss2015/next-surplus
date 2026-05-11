import { IconX } from "@tabler/icons-react";

export function LostBanner({ reason }: { reason: string | null }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-[10px] border border-danger-border bg-danger-bg px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/10">
        <IconX size={16} stroke={2.5} className="text-danger" />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-danger">
          This lead is marked Lost
        </div>
        <div className="mt-[2px] text-[12px] text-danger/85">
          {reason
            ? `Reason: ${reason}`
            : "No reason recorded."}{" "}
          Click any stage above to reactivate it.
        </div>
      </div>
    </div>
  );
}
