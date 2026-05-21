// Settings clone · Phase B.3 — placeholder shown for rail items that haven't
// been converted to real JSX yet. Renders the mockup's breadcrumb pattern and
// a short note pointing back to the static reference at /settings-preview.

import { findItem } from "./SubRail";

export function Placeholder({ panelKey }: { panelKey: string }) {
  const found = findItem(panelKey);
  const group = found?.group ?? "";
  const label = found?.item.label ?? panelKey;

  return (
    <section className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        {group && (
          <>
            <a>{group}</a>
            <i className="icon icon-chevron-right" />
          </>
        )}
        <span className="text-ink-2">{label}</span>
      </div>

      <h1 className="section-h1">{label}</h1>
      <p className="section-desc">
        Phase B will rebuild this panel as real JSX. The static reference
        still lives at <a href="/settings-preview">/settings-preview</a>.
      </p>
    </section>
  );
}
