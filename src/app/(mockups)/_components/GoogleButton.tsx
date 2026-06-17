type Variant = "outline" | "dark" | "ghost" | "underline";

export function GoogleButton({
  label = "Continue With Google",
  variant = "outline",
  size = "md",
}: {
  label?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "lg" ? "h-[40px]" : size === "sm" ? "h-[32px]" : "h-[36px]";
  const text = size === "lg" ? "text-[13.5px]" : "text-[13px]";

  const base = `inline-flex w-full items-center justify-center gap-2 ${h} ${text} font-medium cursor-pointer`;

  const styles: Record<Variant, string> = {
    outline:
      "rounded-[6px] border border-[#e5e7eb] bg-white text-[#04261c] hover:border-[#04261c]",
    dark:
      "rounded-[6px] bg-[#04261c] text-white hover:bg-[#0d4b3a]",
    ghost:
      "rounded-[6px] border border-transparent bg-[#f3f4f6] text-[#04261c] hover:bg-[#e5e7eb]",
    underline:
      "rounded-none border-b border-[#04261c] bg-transparent text-[#04261c]",
  };

  return (
    <button type="button" className={`${base} ${styles[variant]}`}>
      <GoogleGlyph />
      <span>{label}</span>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
