"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { upsertAttorney, deleteAttorney } from "../_actions";
import { cn } from "@/lib/cn";
import type { AttorneyRow } from "@/lib/settings/fetch";

// Settings redesign — Attorneys panel.
// List view with brand-gradient avatars + state chips + edit pencil. Clicking
// a row (or the pencil) opens a right-side drawer for add/edit. Live search
// filters across name / email / fee / state.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Editing = AttorneyRow | "new" | null;

export function AttorneysSection({ initial }: { initial: AttorneyRow[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Editing>(null);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  // Filter rows live by name / email / fee / state.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.name,
        r.email ?? "",
        r.default_cost != null ? String(r.default_cost) : "",
        ...(r.states_covered ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  // Aggregate stats
  const totalStates = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) for (const st of r.states_covered ?? []) s.add(st);
    return s.size;
  }, [rows]);
  const avgFee = useMemo(() => {
    const withFee = rows.filter((r) => r.default_cost != null);
    if (withFee.length === 0) return null;
    return Math.round(withFee.reduce((a, r) => a + (r.default_cost ?? 0), 0) / withFee.length);
  }, [rows]);

  function save(form: {
    id?: string | null;
    name: string;
    email: string;
    states: string;
    cost: string;
    notes: string;
  }) {
    const stateList = form.states.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    startTransition(async () => {
      const result = await upsertAttorney({
        id: form.id ?? null,
        name: form.name,
        email: form.email.trim() || null,
        states_covered: stateList,
        default_cost: form.cost ? Number(form.cost) : null,
        notes: form.notes.trim() || null,
      });
      if (result.ok) {
        if (form.id) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === form.id
                ? {
                    ...r,
                    name: form.name,
                    email: form.email.trim() || null,
                    states_covered: stateList,
                    default_cost: form.cost ? Number(form.cost) : null,
                    notes: form.notes.trim() || null,
                  }
                : r
            )
          );
        } else {
          setRows((prev) => [
            ...prev,
            {
              id: result.id,
              name: form.name,
              email: form.email.trim() || null,
              states_covered: stateList,
              default_cost: form.cost ? Number(form.cost) : null,
              notes: form.notes.trim() || null,
            },
          ]);
        }
        setEditing(null);
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Remove this attorney? Leads currently assigned to them stay on record.")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteAttorney(id);
    });
  }

  return (
    <div className="col-span-2">
      <div className="page-head">
        <div>
          <h1 className="section-h1">Attorneys</h1>
          <p className="section-desc">Attorneys you assign to leads filing claims. Their fee feeds into Estimated Net.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white"
        >
          <IconPlus size={14} stroke={2} />
          Add Attorney
        </button>
      </div>

      {/* Stats strip */}
      <div className="mt-5 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-150">
        <Stat label="Attorneys" value={rows.length.toLocaleString()} />
        <Stat label="States Covered" value={totalStates.toLocaleString()} />
        <Stat label="Average Attorney Fee" value={avgFee != null ? `$${avgFee.toLocaleString()}` : "—"} />
        <Stat label="States Not Covered" value={(50 - totalStates).toLocaleString()} />
      </div>

      {/* Search */}
      <label className="mt-5 flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-surface px-3 text-[12.5px] text-gray-500 focus-within:border-ink">
        <IconSearch size={13} stroke={1.75} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, fee, or state"
          className="flex-1 bg-transparent text-ink outline-none placeholder:text-gray-400"
        />
      </label>

      {/* List */}
      {rows.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <div className="text-[13px] font-medium text-ink">No attorneys yet</div>
          <div className="mt-1 text-[12px] text-gray-500">Add your first attorney to assign on a lead.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No attorneys match <span className="font-mono text-ink">&ldquo;{query}&rdquo;</span>
        </div>
      ) : (
        <div className="mt-3">
          {filtered.map((row) => {
            const states = row.states_covered ?? [];
            const visibleStates = states.slice(0, 4);
            const extra = states.length - visibleStates.length;
            return (
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditing(row);
                }}
                className="flex cursor-pointer items-center gap-4 border-b border-gray-200 py-3.5 last:border-b-0 hover:bg-gray-50"
              >
                <div
                  className="flex-shrink-0 inline-flex items-center justify-center rounded-full text-white text-[11px] font-semibold"
                  style={{
                    width: 32, height: 32,
                    background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
                  }}
                >
                  {initials(row.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{row.name}</div>
                  <div className="mt-0.5 text-[12px] text-gray-500 truncate tabular-nums">
                    {row.email ?? "No email"}
                    {row.default_cost != null && (
                      <>
                        {" · "}
                        <span className="font-medium text-ink">${row.default_cost.toLocaleString()}</span>{" "}
                        per claim
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {visibleStates.map((s) => (
                    <span
                      key={s}
                      className="inline-flex h-6 items-center rounded-md border border-gray-200 bg-surface px-2 text-[11px] font-medium text-ink"
                    >
                      {s}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-[11px] font-medium text-gray-500">
                      +{extra} More
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(row);
                  }}
                  className="ml-2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink"
                  aria-label="Edit"
                  title="Edit"
                >
                  <PencilIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add drawer */}
      {editing !== null && (
        <AttorneyDrawer
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={(id) => {
            setEditing(null);
            remove(id);
          }}
          pending={pending}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className="mt-1 text-[18px] font-semibold text-ink tabular-nums" style={{ letterSpacing: "-0.018em" }}>
        {value}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function AttorneyDrawer({
  editing,
  onClose,
  onSave,
  onDelete,
  pending,
}: {
  editing: AttorneyRow | "new";
  onClose: () => void;
  onSave: (form: {
    id?: string | null;
    name: string;
    email: string;
    states: string;
    cost: string;
    notes: string;
  }) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const initial = editing === "new" ? null : editing;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [states, setStates] = useState((initial?.states_covered ?? []).join(", "));
  const [cost, setCost] = useState(initial?.default_cost != null ? String(initial.default_cost) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function submit() {
    if (!name.trim()) return;
    onSave({ id: initial?.id ?? null, name, email, states, cost, notes });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <>
      <div className={cn("drawer-backdrop", open && "open")} onClick={onClose} />
      <aside className={cn("drawer-panel", open && "open")} aria-hidden={!open}>
        <header className="drawer-head">
          <div>
            <div className="drawer-eyebrow">{initial ? "Edit Attorney" : "Add Attorney"}</div>
            <h2 className="drawer-title">{initial?.name || "New Attorney"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </header>

        <div className="drawer-body">
          <div className="drawer-field">
            <label className="drawer-label">Full Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Jane Daniels, Esq."
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="jane@danielslaw.com"
            />
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Attorney Fee</label>
            <div className="flex items-center" style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, color: "#9298a3", fontSize: 13 }}>$</span>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={inputClass}
                style={{ paddingLeft: 24 }}
                placeholder="1500"
              />
            </div>
          </div>
          <div className="drawer-field">
            <label className="drawer-label">States Covered</label>
            <input
              type="text"
              value={states}
              onChange={(e) => setStates(e.target.value)}
              className={inputClass}
              placeholder="TN, KY, MS"
            />
            <div className="mt-1 text-[11.5px] text-gray-400">
              Comma-separated two-letter abbreviations.
            </div>
          </div>
          <div className="drawer-field">
            <label className="drawer-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className={`${inputClass} drawer-textarea`}
              placeholder="Internal notes (visible to admins only)"
            />
          </div>
        </div>

        <footer className="drawer-foot">
          {initial ? (
            <button
              type="button"
              onClick={() => onDelete(initial.id)}
              className="inline-flex items-center gap-1 rounded-md bg-transparent px-2 py-[6px] text-[12.5px] font-medium text-danger hover:underline"
            >
              <IconTrash size={13} stroke={1.75} />
              Remove Attorney
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12.5px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim() || pending}
              className="rounded-md btn-primary px-3 py-[6px] text-[12.5px] font-medium text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : initial ? "Save Changes" : "Add Attorney"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
