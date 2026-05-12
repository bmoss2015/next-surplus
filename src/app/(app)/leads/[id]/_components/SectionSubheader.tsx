import { cn } from "@/lib/cn";

// Fix AA: one consistent treatment for in-card section subheaders (Sale
// Financials, Surplus And Fees, Liens, Phone, Email, ...). Always larger and
// more prominent than the labels/values beneath it.
export function SectionSubheader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#0a3d4a]",
        className
      )}
    >
      {children}
    </div>
  );
}
