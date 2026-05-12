// Fix BBBBB: Title-case a person's name for display — capitalize the first
// letter of each space- or hyphen-delimited part and lowercase the rest. Unlike
// toProperCase (which preserves ALL-CAPS acronyms), this always normalizes, so
// "JOHN SMITH" and "john smith" both render as "John Smith".
export function properCaseName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-")
    )
    .join(" ");
}
