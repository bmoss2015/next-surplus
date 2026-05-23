"use client";

// Unified save bar for inline editable panels (Customer Pricing, future
// Lob Pricing, Mail Settings, etc). Anchored bottom-right of the
// viewport, dark ink background, white text. Slides in when any
// registered section is dirty; hidden when nothing is pending.
//
// Pattern:
// - SettingsSaveProvider wraps the surface (a Settings or Owner page)
// - Each editable section calls useSaveBarSection(id, registration)
//   with an isDirty flag plus save / discard callbacks
// - The bar reads the registrations off context, shows the count, and
//   wires Save All / Discard All buttons through to each section
//
// Drawer-based forms (Attorney, Bank Account, Member) keep their own
// internal Save button — they're modal-like commits and don't fold into
// this aggregated save flow. Defaults panel auto-saves per Option C.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SaveBarRegistration = {
  isDirty: boolean;
  save: () => Promise<{ ok: true } | { ok: false; error: string }>;
  discard: () => void;
};

type Ctx = {
  register: (id: string, reg: SaveBarRegistration) => void;
  unregister: (id: string) => void;
};

const SaveBarContext = createContext<Ctx | null>(null);

type RegMap = Map<string, SaveBarRegistration>;

export function SettingsSaveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Registrations live in a ref so re-renders of children don't reset
  // them. A version counter forces the bar to re-render when the map
  // changes (Map identity doesn't change in React state).
  const regsRef = useRef<RegMap>(new Map());
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const register = useCallback(
    (id: string, reg: SaveBarRegistration) => {
      regsRef.current.set(id, reg);
      bump();
    },
    [bump]
  );
  const unregister = useCallback(
    (id: string) => {
      regsRef.current.delete(id);
      bump();
    },
    [bump]
  );

  const ctx = useMemo(() => ({ register, unregister }), [register, unregister]);

  return (
    <SaveBarContext.Provider value={ctx}>
      {children}
      <SaveBarUI regs={regsRef.current} version={version} />
    </SaveBarContext.Provider>
  );
}

export function useSaveBarSection(id: string, reg: SaveBarRegistration) {
  const ctx = useContext(SaveBarContext);
  // Re-register whenever the dirty flag flips so the bar's count reflects
  // the latest state. Save / discard callbacks are stable closures from
  // the section's useState setters; including them in deps keeps the
  // latest snapshot of state captured at each render.
  useEffect(() => {
    if (!ctx) return;
    ctx.register(id, reg);
    return () => ctx.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, id, reg.isDirty, reg.save, reg.discard]);
}

function SaveBarUI({
  regs,
  version,
}: {
  regs: RegMap;
  version: number;
}) {
  void version; // re-render trigger only
  const dirty = useMemo(
    () => Array.from(regs.values()).filter((r) => r.isDirty),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regs, version]
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAll() {
    setPending(true);
    setError(null);
    const errors: string[] = [];
    for (const reg of dirty) {
      const res = await reg.save();
      if (!res.ok) errors.push(res.error);
    }
    if (errors.length > 0) {
      setError(errors.join(" · "));
    }
    setPending(false);
  }

  function discardAll() {
    for (const reg of dirty) reg.discard();
    setError(null);
  }

  if (dirty.length === 0 && !error) return null;
  const label =
    dirty.length === 0
      ? "No changes"
      : dirty.length === 1
        ? "1 change pending"
        : `${dirty.length} changes pending`;

  return (
    <div
      className="fixed z-[60] flex items-center gap-3 rounded-xl shadow-xl"
      style={{
        right: 24,
        bottom: 24,
        background: "#0a0d14",
        color: "#fff",
        padding: "10px 14px 10px 18px",
        boxShadow: "0 10px 30px -8px rgba(10, 13, 20, 0.45)",
        animation: "moss-savebar-in 180ms ease-out",
      }}
    >
      <style>{`
        @keyframes moss-savebar-in {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="flex flex-col">
        <span className="text-[12.5px] font-medium tracking-tight">
          {label}
        </span>
        {error && (
          <span className="mt-[1px] max-w-[280px] truncate text-[11px] text-red-300">
            {error}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={discardAll}
        disabled={pending || dirty.length === 0}
        className="cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
      >
        Discard
      </button>
      <button
        type="button"
        onClick={saveAll}
        disabled={pending || dirty.length === 0}
        className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-gray-100 disabled:opacity-50"
        style={{ color: "#0a0d14" }}
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
