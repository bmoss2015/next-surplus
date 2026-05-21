// Font detection + supported-set check for mail templates.
//
// The portal sends docx templates to a Gotenberg (LibreOffice headless)
// renderer for PDF conversion. LibreOffice substitutes any font that
// isn't installed in the container with a "best guess" fallback, which
// typically has different character widths than the original — tables
// then overflow and overlap content above/below. The fix is to keep the
// renderer's installed-font list in sync with what templates actually
// use, and to flag uploads that reference a font the renderer doesn't
// have.
//
// SUPPORTED_FONTS reflects what's baked into the Gotenberg image at
// us-central1-docker.pkg.dev/.../gotenberg-fonts:latest. Update this
// list any time the Dockerfile changes which fonts it installs.

export const SUPPORTED_FONTS: ReadonlySet<string> = new Set(
  [
    // Microsoft core fonts (ttf-mscorefonts-installer)
    "Arial",
    "Arial Black",
    "Arial Narrow",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Trebuchet MS",
    "Georgia",
    "Comic Sans MS",
    "Impact",
    "Andale Mono",
    "Webdings",

    // LibreOffice metric-compatible replacements (always available)
    "Liberation Sans",
    "Liberation Serif",
    "Liberation Mono",
    "Carlito", // Calibri replacement
    "Caladea", // Cambria replacement

    // Other Debian-packaged fonts
    "Roboto",
    "Roboto Condensed",
    "Roboto Slab",
    "Lato",
    "Open Sans",
    "Open Sans Condensed",
    "Noto Sans",
    "Noto Serif",
    "Noto Sans Mono",
    "Fira Code",
    "Inconsolata",
    "Cantarell",
    "DejaVu Sans",
    "DejaVu Serif",
    "DejaVu Sans Mono",

    // Google Fonts pulled from github.com/google/fonts at build time
    "Inter",
    "Poppins",
    "Montserrat",
    "Raleway",
    "Nunito",
    "Nunito Sans",
    "Quicksand",
    "Karla",
    "DM Sans",
    "Manrope",
    "Heebo",
    "Work Sans",
    "Rubik",
    "Mulish",
    "Cabin",
    "Barlow",
    "Barlow Condensed",
    "Barlow Semi Condensed",
    "Dosis",
    "Josefin Sans",
    "Merriweather",
    "Playfair Display",
    "Lora",
    "Source Serif 4",
    "Source Serif Pro",
    "EB Garamond",
    "Cormorant Garamond",
    "Libre Baskerville",
    "Spectral",
    "Bitter",
    "PT Serif",
    "PT Sans",
    "Plus Jakarta Sans",
    "Fira Sans",
    "Fira Serif",
    "Crimson Pro",
    "Crimson Text",
    "Archivo",
    "Archivo Narrow",
  ].map((s) => s.toLowerCase())
);

// Common Microsoft fonts that LibreOffice maps to metric-compatible
// replacements automatically — uploads using these don't need a warning
// because the substitute (e.g. Carlito for Calibri) preserves layout.
export const METRIC_COMPATIBLE_ALIASES: ReadonlyMap<string, string> = new Map([
  ["calibri", "Carlito"],
  ["cambria", "Caladea"],
  ["calibri light", "Carlito"],
  ["arial", "Liberation Sans"], // also available as Arial directly via mscorefonts
  ["times new roman", "Liberation Serif"],
  ["courier new", "Liberation Mono"],
]);

export function isFontSupported(name: string): boolean {
  const lower = name.trim().toLowerCase();
  if (SUPPORTED_FONTS.has(lower)) return true;
  if (METRIC_COMPATIBLE_ALIASES.has(lower)) return true;
  return false;
}

// Extracts the set of font family names referenced anywhere in a .docx
// buffer's text-formatting XML (document body, styles, headers, footers).
// Returns deduped names in their original casing.
export async function detectDocxFonts(buffer: Buffer): Promise<string[]> {
  const PizZip = (await import("pizzip")).default;
  const zip = new PizZip(buffer);
  const candidatePaths = [
    "word/document.xml",
    "word/styles.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
    "word/fontTable.xml",
    "word/theme/theme1.xml",
  ];
  const seen = new Map<string, string>(); // lowercase -> original
  // w:ascii / w:hAnsi / w:cs / w:eastAsia attributes on <w:rFonts> tags
  // are how Word records the font family for a run. fontTable.xml uses
  // <w:font w:name="..."> entries. Theme XML uses <a:latin typeface="...">.
  const fontAttrRe = /(?:w:ascii|w:hAnsi|w:cs|w:eastAsia)="([^"]+)"/g;
  const fontNameRe = /<w:font\s+w:name="([^"]+)"/g;
  const themeRe = /<a:latin\s+typeface="([^"]+)"/g;
  for (const path of candidatePaths) {
    const file = zip.file(path);
    if (!file) continue;
    const xml = file.asText();
    for (const re of [fontAttrRe, fontNameRe, themeRe]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(xml)) !== null) {
        const raw = m[1].trim();
        if (!raw || raw === "+mn-lt" || raw === "+mj-lt") continue;
        const key = raw.toLowerCase();
        if (!seen.has(key)) seen.set(key, raw);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}
