// Throwaway preview route. Renders the candidate gradients side by side so
// Bree can pick the final brand gradient before we ship the palette PR.
// Delete this file (+ folder) after the decision lands.

const GRADIENTS = [
  {
    label: "1. Members hero (current)",
    desc: "linear-gradient(135deg, #04261c 0%, #0d4b3a 100%) — what /settings Members uses today. Deep emerald reads near-black.",
    css: "linear-gradient(135deg, #04261c 0%, #0d4b3a 100%)",
  },
  {
    label: "2. Vertical Members hero",
    desc: "Same colors, vertical direction instead of diagonal. Better for sidebars.",
    css: "linear-gradient(180deg, #04261c 0%, #0d4b3a 100%)",
  },
  {
    label: "3. Charcoal-ink → emerald",
    desc: "#0f1729 (the portal's ink charcoal) → #0d4b3a. True black-feeling start (different hue than emerald, slightly cooler) into brand emerald.",
    css: "linear-gradient(135deg, #0f1729 0%, #0d4b3a 100%)",
  },
  {
    label: "4. Pure black → emerald",
    desc: "Actual black (#000) → #0d4b3a. The most contrasty option.",
    css: "linear-gradient(135deg, #000000 0%, #0d4b3a 100%)",
  },
  {
    label: "5. Three-stop dynamic",
    desc: "Gray → ink → emerald. Has visible gray + black + green all at once.",
    css: "linear-gradient(135deg, #374151 0%, #0f1729 50%, #0d4b3a 100%)",
  },
  {
    label: "6. Three-stop emerald",
    desc: "Deep → brand → brand-2. All emerald, lighter end. The mockup's .bg-hero-gradient style.",
    css: "linear-gradient(135deg, #04261c 0%, #0d4b3a 70%, #13644e 100%)",
  },
];

export default function GradientPreview() {
  return (
    <div
      style={{
        padding: 40,
        background: "#f0f3f7",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#0f1729", margin: 0 }}>
          Gradient candidates
        </h1>
        <p style={{ fontSize: 14, color: "#5b606a", marginTop: 8, marginBottom: 32 }}>
          Tell me a number. Whichever you pick gets applied to
          .bg-sidebar-gradient, .bg-hero-gradient, and the Members /
          Dashboard hero blocks portal-wide.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 24,
          }}
        >
          {GRADIENTS.map((g) => (
            <div key={g.label}>
              <div
                style={{
                  background: g.css,
                  borderRadius: 14,
                  padding: "32px 28px",
                  minHeight: 200,
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 24px rgba(13, 75, 58, 0.20)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    Hero Block
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      marginTop: 8,
                    }}
                  >
                    Moss Equity Partners
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "rgba(255,255,255,0.78)",
                      marginTop: 4,
                    }}
                  >
                    4 members · 3 active · 1 pending
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                  <button
                    type="button"
                    style={{
                      background: "#ffffff",
                      color: "#0d4b3a",
                      border: 0,
                      borderRadius: 7,
                      padding: "8px 14px",
                      fontSize: 12.25,
                      fontWeight: 500,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px -2px rgba(12,13,16,0.12)",
                    }}
                  >
                    Light Button
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 7,
                      padding: "8px 14px",
                      fontSize: 12.25,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Outline Button
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#0f1729" }}>
                {g.label}
              </div>
              <div style={{ fontSize: 12, color: "#5b606a", marginTop: 4, lineHeight: 1.5 }}>
                {g.desc}
              </div>
              <code
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: 10.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#5b606a",
                  background: "#fff",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {g.css}
              </code>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            padding: 24,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f1729", margin: 0 }}>
            Same primary button on each background
          </h2>
          <p style={{ fontSize: 12.5, color: "#5b606a", marginTop: 6 }}>
            Each row places the same #0d4b3a emerald primary button on top of
            the gradient — so you can see whether the button still reads as
            the click target or gets visually absorbed by the background.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {GRADIENTS.map((g, i) => (
              <div
                key={g.label}
                style={{
                  background: g.css,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 500 }}>
                  Option {i + 1}
                </span>
                <button
                  type="button"
                  style={{
                    background: "#0d4b3a",
                    color: "#fff",
                    border: 0,
                    borderRadius: 7,
                    padding: "8px 16px",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)",
                  }}
                >
                  Next Stage →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
