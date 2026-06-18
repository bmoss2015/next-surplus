type Size = "sm" | "md" | "lg" | "xl";
type Tone = "light" | "dark";

const HEIGHTS: Record<Size, number> = { sm: 18, md: 22, lg: 28, xl: 36 };

export function BrandLogo({
  size = "md",
  tone = "light",
  variant = "wordmark",
}: {
  size?: Size;
  tone?: Tone;
  variant?: "wordmark" | "lockup";
}) {
  const h = HEIGHTS[size];
  const fileBase =
    variant === "lockup"
      ? tone === "light"
        ? "03-lockup-horizontal-light"
        : "04-lockup-horizontal-dark"
      : tone === "light"
      ? "07-wordmark-only-light"
      : "08-wordmark-only-dark";
  return (
    <img
      src={`/brand/${fileBase}.svg`}
      alt="Next Surplus"
      style={{ height: h, width: "auto", display: "block" }}
    />
  );
}
