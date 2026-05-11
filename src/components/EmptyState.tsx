import Link from "next/link";

export function EmptyState({
  icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-surface px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 flex justify-center text-gray-400">{icon}</div>
      )}
      <div className="text-[15px] font-medium text-ink">{title}</div>
      <div className="mx-auto mt-1 max-w-md text-[12.5px] text-gray-500">
        {description}
      </div>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-4 inline-block rounded-md btn-primary px-4 py-2 text-xs font-medium text-white"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
