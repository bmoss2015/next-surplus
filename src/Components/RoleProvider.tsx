"use client";

import { createContext, useContext } from "react";

const RoleContext = createContext<{ isAdmin: boolean; isOwner: boolean }>({
  isAdmin: false,
  isOwner: false,
});

export function RoleProvider({
  isAdmin,
  isOwner,
  children,
}: {
  isAdmin: boolean;
  isOwner: boolean;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={{ isAdmin, isOwner }}>
      {children}
    </RoleContext.Provider>
  );
}

// Read the current user's role from any client component under <AppShell>.
export function useRole() {
  return useContext(RoleContext);
}
