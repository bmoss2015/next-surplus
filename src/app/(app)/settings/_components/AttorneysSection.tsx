"use client";

// Settings clone · Phase D — Attorneys with edit drawer.
//
// Reads the org's attorneys from AttorneyRow[]. Search is wired client-side
// over name/email/states/fee. Add Attorney + per-row edit pencil both open
// the shared <AttorneyDrawer />, which calls upsertAttorney/deleteAttorney
// and refreshes the page on success.

import { useMemo, useState } from "react";
import type { AttorneyRow } from "@/lib/settings/fetch";
import { AttorneyDrawer } from "./AttorneyDrawer";

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtMoney(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

const ALL_STATES = 50;

// `editing` is "new" for the add drawer, an AttorneyRow for edit, or null
// when the drawer is closed.
type DrawerState = { kind: "closed" } | { kind: "new" } | { kind: "edit"; row: AttorneyRow };

export function AttorneysSection({
  initial,
  canEdit,
}: {
  initial: AttorneyRow[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<DrawerState>({ kind: "closed" });

  const stats = useMemo(() => {
    const stateSet = new Set<string>();
    for (const a of initial) for (const s of a.states_covered) stateSet.add(s);
    const fees = initial
      .map((a) => a.default_cost)
      .filter((n): n is number => n != null && Number.isFinite(n));
    const avg =
      fees.length > 0 ? fees.reduce((a, b) => a + b, 0) / fees.length : 0;
    return {
      total: initial.length,
      covered: stateSet.size,
      avg,
      notCovered: Math.max(0, ALL_STATES - stateSet.size),
    };
  }, [initial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initial;
    return initial.filter((a) => {
      const blob = [
        a.name,
        a.email ?? "",
        ...a.states_covered,
        a.default_cost != null ? String(a.default_cost) : "",
        a.default_cost != null ? Math.round(a.default_cost).toLocaleString() : "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [initial, query]);

  return (
    <section id="panel-attorneys" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Leads</a>
        <i className="icon icon-chevron-right" />
        <span>Attorneys</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Attorneys</h1>
          <p className="section-desc">
            Attorneys you assign to leads filing claims. Their default cost
            feeds into Estimated Net To You.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setDrawer({ kind: "new" })}
          >
            <i className="icon icon-plus" /> Add Attorney
          </button>
        )}
      </div>

      <div className="stats-strip">
        <div className="stat-cell">
          <div className="label">Attorneys</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-cell">
          <div className="label">States Covered</div>
          <div className="value value-em">{stats.covered}</div>
        </div>
        <div className="stat-cell">
          <div className="label">Average Attorney Fee</div>
          <div className="value">{fmtMoney(stats.avg)}</div>
        </div>
        <div className="stat-cell">
          <div className="label">States Not Covered</div>
          <div className="value">{stats.notCovered}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 mb-4">
        <label
          className="topbar-search attorney-search-wrap"
          style={{ height: 34, flex: 1, maxWidth: 320, minWidth: 0 }}
        >
          <i className="icon icon-search" />
          <input
            type="search"
            placeholder="Search by name, email, fee, or state"
            className="attorney-search-input"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-outline btn-sm" disabled>
          <i className="icon icon-filter" /> State
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled>
          <i className="icon icon-arrow-up-down" /> Sort
        </button>
      </div>

      {filtered.length === 0 && query && (
        <div className="attorney-empty">
          No attorneys match <span>&ldquo;{query}&rdquo;</span>
        </div>
      )}

      <div className="list attorney-list">
        {filtered.map((a) => {
          const isNational = a.states_covered.length >= ALL_STATES;
          const shown = isNational ? [] : a.states_covered.slice(0, 4);
          const overflow = isNational
            ? 0
            : Math.max(0, a.states_covered.length - shown.length);
          return (
            <div key={a.id} className="list-row attorney-row">
              <div className="avatar av-self">{avatarInitials(a.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="row-name text-[13.5px] font-medium">
                  {a.name}
                </div>
                <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
                  {a.email ?? ""}
                  {a.email && a.default_cost != null && " · "}
                  {a.default_cost != null && (
                    <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                      {fmtMoney(a.default_cost)}
                    </span>
                  )}
                  {a.default_cost != null && " per claim"}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isNational ? (
                  <span className="chip chip-all">All 50 States</span>
                ) : (
                  <>
                    {shown.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="chip chip-more">+{overflow} More</span>
                    )}
                  </>
                )}
              </div>
              {canEdit && (
                <div className="overflow flex items-center gap-0.5 ml-2">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Edit"
                    onClick={() => setDrawer({ kind: "edit", row: a })}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && !query && (
          <div className="list-row" style={{ color: "var(--text-3)" }}>
            No attorneys yet. Click Add Attorney to get started.
          </div>
        )}
      </div>

      <AttorneyDrawer
        attorney={drawer.kind === "edit" ? drawer.row : null}
        open={drawer.kind !== "closed"}
        onClose={() => setDrawer({ kind: "closed" })}
      />
    </section>
  );
}
