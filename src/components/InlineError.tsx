export function InlineError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-[#b91c1c]"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        aria-hidden
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <circle cx="7" cy="7" r="6.4" stroke="#b91c1c" strokeWidth="1.2" fill="none" />
        <rect x="6.25" y="3.6" width="1.5" height="4.2" rx="0.6" fill="#b91c1c" />
        <circle cx="7" cy="9.7" r="0.85" fill="#b91c1c" />
      </svg>
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}
