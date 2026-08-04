"use client";

import { createContext, useContext } from "react";

const DEFAULT_LOGO = "/gpplus-mark.png";

const LogoContext = createContext<string>(DEFAULT_LOGO);

/**
 * Makes the current brand logo (uploaded in Settings, or the default) available
 * to descendants, including the route loading fallback rendered inside the app
 * shell, so the loading screen can show the right logo.
 */
export function LogoProvider({
  value,
  children,
}: {
  value: string | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <LogoContext.Provider value={value || DEFAULT_LOGO}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo(): string {
  return useContext(LogoContext);
}
