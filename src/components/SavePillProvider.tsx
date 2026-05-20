"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Universal Save Pill — a black bottom-right pill that appears whenever any
// settings panel reports unsaved changes. Click "Save changes" fires all the
// registered save callbacks in parallel; "Discard" resets them.
//
// A panel hooks in via useSavePill({ key, dirty, save, discard }). The key
// must be stable per panel. dirty / save / discard track the panel's current
// values; the provider re-reads them from refs at the moment save runs, so
// the panel doesn't need to memoize.

type Entry = {
  dirty: boolean;
  save: () => Promise<void>;
  discard: () => void;
};

type Ctx = {
  register: (key: string, entry: Entry) => void;
  unregister: (key: string) => void;
  dirtyCount: number;
  saving: boolean;
  saveAll: () => Promise<void>;
  discardAll: () => void;
};

const SavePillCtx = createContext<Ctx | null>(null);

export function SavePillProvider({ children }: { children: ReactNode }) {
  const registry = useRef<Map<string, Entry>>(new Map());
  const [dirtyCount, setDirtyCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function recompute() {
    let n = 0;
    registry.current.forEach((e) => {
      if (e.dirty) n++;
    });
    setDirtyCount(n);
  }

  const register = useCallback((key: string, entry: Entry) => {
    registry.current.set(key, entry);
    recompute();
  }, []);

  const unregister = useCallback((key: string) => {
    registry.current.delete(key);
    recompute();
  }, []);

  const saveAll = useCallback(async () => {
    setSaving(true);
    setErrorMsg(null);
    const dirtyEntries = Array.from(registry.current.values()).filter((e) => e.dirty);
    try {
      // Sequential — easier error semantics than Promise.all here, and there
      // are typically only 1-2 dirty panels at a time anyway.
      for (const e of dirtyEntries) {
        await e.save();
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setErrorMsg(m);
    } finally {
      setSaving(false);
    }
  }, []);

  const discardAll = useCallback(() => {
    registry.current.forEach((e) => {
      if (e.dirty) e.discard();
    });
    setErrorMsg(null);
  }, []);

  return (
    <SavePillCtx.Provider
      value={{ register, unregister, dirtyCount, saving, saveAll, discardAll }}
    >
      {children}
      <SavePill errorMsg={errorMsg} />
    </SavePillCtx.Provider>
  );
}

function SavePill({ errorMsg }: { errorMsg: string | null }) {
  const ctx = useContext(SavePillCtx);
  if (!ctx) return null;
  const show = ctx.dirtyCount > 0;
  return (
    <div className={`save-pill${show ? " show" : ""}`}>
      <span className="count">
        <strong>{ctx.dirtyCount}</strong> unsaved
      </span>
      {errorMsg && (
        <span style={{ color: "#fca5a5", fontSize: 11.5, paddingRight: 4 }}>
          {errorMsg}
        </span>
      )}
      <button
        type="button"
        className="discard"
        onClick={ctx.discardAll}
        disabled={ctx.saving}
      >
        Discard
      </button>
      <button
        type="button"
        className="save"
        onClick={() => {
          void ctx.saveAll();
        }}
        disabled={ctx.saving}
      >
        {ctx.saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

export function useSavePill({
  key,
  dirty,
  save,
  discard,
}: {
  key: string;
  dirty: boolean;
  save: () => Promise<void>;
  discard: () => void;
}) {
  const ctx = useContext(SavePillCtx);

  // Stash the latest callbacks in refs so the registry doesn't churn on every
  // render. The provider reads them via the closure below.
  const saveRef = useRef(save);
  const discardRef = useRef(discard);
  saveRef.current = save;
  discardRef.current = discard;

  useEffect(() => {
    if (!ctx) return;
    ctx.register(key, {
      dirty,
      save: () => saveRef.current(),
      discard: () => discardRef.current(),
    });
    return () => ctx.unregister(key);
  }, [ctx, key, dirty]);
}
