// Strip internal test-data markers from recipient names so the UI
// never shows engineer artifacts to a user. The HARNESS_TAG marker
// is added by the test harness so cleanup can find scenario rows;
// stripping it on display keeps the table reading like production
// data even when scenarios have just been run.
const HARNESS_PREFIX = "__mailtest__";

export function displayRecipientName(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (s.startsWith(HARNESS_PREFIX)) {
    return s.slice(HARNESS_PREFIX.length).trim() || s;
  }
  return s;
}

// Initials for the avatar circle — Linear / Attio / Affinity all use
// 1-2 letter initials in a colored circle as the row anchor. Picks
// first letters of first two words, uppercase. Falls back to the
// first two characters of the cleaned name.
export function recipientInitials(raw: string | null | undefined): string {
  const clean = displayRecipientName(raw);
  if (!clean) return "—";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

// Deterministic color for an avatar circle so the same recipient gets
// the same color every time across renders. Uses a small palette of
// brand-aligned tints so circles never look like "AI-built rainbow"
// avatars.
// Cool-tone palette only — no yellow/amber/orange per portal design
// rules. Each entry is a Tailwind class pair for the circle bg + the
// initials text.
const AVATAR_PALETTE = [
  { bg: "bg-petrol-100", text: "text-petrol-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
];

export function recipientAvatarStyle(raw: string | null | undefined): {
  bg: string;
  text: string;
} {
  const clean = displayRecipientName(raw);
  if (!clean) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
