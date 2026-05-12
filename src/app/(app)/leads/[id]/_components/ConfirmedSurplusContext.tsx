"use client";

import { createContext, useContext, useState } from "react";

// Fix Z: confirmed surplus has one source of truth on the lead page. The
// breakdown card edits it; the metric strip reads it; both go through this
// context so an edit shows up everywhere instantly (the server action still
// persists + revalidates in the background).
type Ctx = {
  confirmedSurplus: number | null;
  setConfirmedSurplus: (n: number | null) => void;
};

const ConfirmedSurplusCtx = createContext<Ctx | null>(null);

export function ConfirmedSurplusProvider({
  initial,
  children,
}: {
  initial: number | null;
  children: React.ReactNode;
}) {
  const [confirmedSurplus, setConfirmedSurplus] = useState<number | null>(initial);
  return (
    <ConfirmedSurplusCtx.Provider value={{ confirmedSurplus, setConfirmedSurplus }}>
      {children}
    </ConfirmedSurplusCtx.Provider>
  );
}

export function useConfirmedSurplus(): Ctx {
  const ctx = useContext(ConfirmedSurplusCtx);
  if (!ctx) {
    throw new Error("useConfirmedSurplus must be used within ConfirmedSurplusProvider");
  }
  return ctx;
}
