"use client";

import { createContext, useContext } from "react";

const RoleContext = createContext<{ isAdmin: boolean }>({ isAdmin: false });

export function RoleProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ isAdmin }}>{children}</RoleContext.Provider>
  );
}

// Read the current user's role from any client component under <AppShell>.
export function useRole() {
  return useContext(RoleContext);
}
