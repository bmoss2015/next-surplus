export function PlaceholderPage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          {title}
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">{subtitle}</div>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-surface p-10 text-center shadow-card">
        <div className="text-[11px] tracking-[0.4px] text-gray-500">
          Not built yet
        </div>
        <div className="mt-2 text-[15px] text-ink">
          This route is part of the v0 scope and will be built in a later
          checkpoint.
        </div>
      </div>
    </div>
  );
}
