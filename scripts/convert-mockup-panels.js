/* eslint-disable */
// Settings clone · Phase B — mechanical HTML → JSX converter for panels.
//
// Reads src/data/settings-mockup.html, extracts every <section id="panel-*">
// in the body, transforms HTML attributes/tags into JSX form, and writes
// each panel as its own _components/<Name>Section.tsx file in the
// /settings-preview-jsx route.
//
// Run with `node scripts/convert-mockup-panels.js` from the repo root.
// Idempotent — re-running overwrites the generated files.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src", "data", "settings-mockup.html");
const OUT_DIR = path.join(ROOT, "src", "app", "settings-preview-jsx", "_components");

const html = fs.readFileSync(SRC, "utf-8");

// Match every <section id="panel-X" class="panel ...">…</section>.
const panelRegex = /<section id="panel-([a-z-]+)" class="panel( active)?">([\s\S]*?)<\/section>/g;

const panels = {};
let m;
while ((m = panelRegex.exec(html)) !== null) {
  panels[m[1]] = m[3];
}
console.log("Found panels:", Object.keys(panels));

// React attribute renames for HTML attrs that are camelCase in JSX. SVG attrs
// included because the mockup has inline SVGs for edit pencils, mail icons, etc.
const ATTR_RENAMES = [
  ["class", "className"],
  ["for", "htmlFor"],
  ["tabindex", "tabIndex"],
  ["minlength", "minLength"],
  ["maxlength", "maxLength"],
  ["autocomplete", "autoComplete"],
  ["crossorigin", "crossOrigin"],
  ["spellcheck", "spellCheck"],
  ["contenteditable", "contentEditable"],
  ["readonly", "readOnly"],
  ["enctype", "encType"],
  ["accept-charset", "acceptCharset"],
  ["http-equiv", "httpEquiv"],
  ["stroke-width", "strokeWidth"],
  ["stroke-linecap", "strokeLinecap"],
  ["stroke-linejoin", "strokeLinejoin"],
  ["stroke-dasharray", "strokeDasharray"],
  ["stroke-dashoffset", "strokeDashoffset"],
  ["stroke-miterlimit", "strokeMiterlimit"],
  ["stroke-opacity", "strokeOpacity"],
  ["fill-opacity", "fillOpacity"],
  ["fill-rule", "fillRule"],
  ["clip-rule", "clipRule"],
  ["clip-path", "clipPath"],
  ["xlink:href", "xlinkHref"],
  ["vector-effect", "vectorEffect"],
  ["text-anchor", "textAnchor"],
];

function transformAttrs(s) {
  for (const [from, to] of ATTR_RENAMES) {
    // Match the attribute name only when it sits right after whitespace or
    // a tag-open '<', so we don't accidentally munge it inside string values.
    const safe = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`(\\s)${safe}=`, "g"), `$1${to}=`);
  }
  return s;
}

// Strip inline event handlers — onclick/onchange/oninput/onblur/onkeydown/etc.
// Match the attribute name only after whitespace, then quoted value.
function stripEventHandlers(s) {
  return s.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/g, "")
          .replace(/\s+on[a-z]+\s*=\s*'[^']*'/g, "");
}

// Convert inline `style="x: y; w: z"` to `style={{ x: 'y', w: 'z' }}`.
function transformStyles(s) {
  return s.replace(/\sstyle="([^"]*)"/g, (_, css) => {
    const props = css
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf(":");
        if (idx === -1) return null;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return `${camel}: ${JSON.stringify(v)}`;
      })
      .filter(Boolean);
    return ` style={{ ${props.join(", ")} }}`;
  });
}

// HTML void elements that need to self-close in JSX.
const VOID_TAGS = ["input", "br", "hr", "img", "meta", "link", "source", "wbr"];

// Self-closes void elements like <input ...> → <input ... />. Handles both
// single-line and multi-line attribute lists. Skips tags that are already
// self-closed (`<input ... />`).
function selfCloseVoids(s) {
  for (const tag of VOID_TAGS) {
    s = s.replace(new RegExp(`<${tag}\\b([^>]*?)(?<![/])>`, "g"), `<${tag}$1 />`);
  }
  // <i ...></i> → <i ... /> (mockup uses <i> as icon glyphs that are empty)
  s = s.replace(/<i([^>]*)>\s*<\/i>/g, "<i$1 />");
  return s;
}

// HTML comments → JSX comments.
function commentsToJsx(s) {
  return s.replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");
}

// `value="x"` on <input>/<textarea> becomes `defaultValue="x"` so React
// doesn't treat them as controlled inputs without onChange handlers.
function valuesToDefaults(s) {
  return s.replace(/<(input|textarea)\b([^>]*?)\bvalue=/g, "<$1$2defaultValue=");
}

// Convert numeric string attribute values into JSX expression form so React's
// types accept them: `minLength="8"` → `minLength={8}`.
const NUMERIC_ATTRS = [
  "minLength",
  "maxLength",
  "cols",
  "rows",
  "tabIndex",
  "size",
  "span",
];
function numericAttrs(s) {
  for (const a of NUMERIC_ATTRS) {
    const re = new RegExp(`(\\s${a}=)"(\\d+)"`, "g");
    s = s.replace(re, "$1{$2}");
  }
  return s;
}

// Mustache merge fields like `{{first_name}}` are valid mockup syntax but JSX
// reads `{{` as the start of an inline-expression object literal. Wrap the
// whole token as a string expression so JSX renders the literal text.
function escapeMustaches(s) {
  return s.replace(/\{\{([^{}]+)\}\}/g, '{"{{$1}}"}');
}

// Some loose attributes like `disabled style="opacity:0.5;"` confuse the
// style regex. The order matters — strip handlers first, then transform.
function htmlToJsx(s) {
  s = stripEventHandlers(s);
  s = commentsToJsx(s);
  s = escapeMustaches(s);
  s = transformAttrs(s);
  s = transformStyles(s);
  s = selfCloseVoids(s);
  s = valuesToDefaults(s);
  s = numericAttrs(s);
  return s;
}

// Stable ordering — by component name — for deterministic output.
const COMPONENT_MAP = {
  password: "SecuritySection",
  notifications: "NotificationsSection",
  defaults: "DefaultsSection",
  attorneys: "AttorneysSection",
  team: "TeamSection",
  "email-accounts": "EmailAccountsSection",
  pipeline: "PipelineSection",
  company: "CompanyProfileSection",
  billing: "BillingSection",
  "mail-settings": "MailSettingsSection",
  "mail-bank": "MailBankAccountsSection",
  "lost-reasons": "LostReasonsSection",
  "contact-roles": "ContactRolesSection",
  templates: "TemplatesSection",
  "email-templates": "EmailTemplatesSection",
  "sms-templates": "SmsTemplatesSection",
  "research-templates": "ResearchTemplatesSection",
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
for (const [id, name] of Object.entries(COMPONENT_MAP)) {
  const inner = panels[id];
  if (!inner) {
    console.log("SKIP", id, "— panel not found in mockup");
    continue;
  }
  const jsxBody = htmlToJsx(inner.trim());
  const indented = jsxBody
    .split("\n")
    .map((l) => (l.length ? "      " + l : l))
    .join("\n");
  const file = `// Settings clone · Phase B — ${name}.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function ${name}() {
  return (
    <section id="panel-${id}" className="panel active">
${indented}
    </section>
  );
}
`;
  fs.writeFileSync(path.join(OUT_DIR, `${name}.tsx`), file);
  results.push(name);
  console.log("WROTE", name);
}

console.log(`\nGenerated ${results.length} panel components.`);
