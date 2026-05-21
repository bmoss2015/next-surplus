// Fallback panel rendered when the URL hash points at a key that isn't a
// real rail item. Shouldn't happen in normal use; included as a safety net
// for old bookmarks or typos in hash links.

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
        Pick a section from the rail on the left.
      </p>
    </section>
  );
}
