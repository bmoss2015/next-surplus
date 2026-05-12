import { cn } from "@/lib/cn";

// Fix TT: the one section-subheader treatment for the portal — 11px / 700 /
// uppercase / 0.08em / #0a3d4a / 12px bottom margin (the `.section-subheader`
// CSS class in globals.css).
export function SectionSubheader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("section-subheader", className)}>{children}</div>;
}
