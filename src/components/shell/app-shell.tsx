"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { logout } from "@/lib/auth/actions";
import { ScanModal } from "@/components/shell/scan-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogoProvider } from "@/components/shell/logo-context";
import { useGlobalScanner } from "@/components/shell/use-global-scanner";
import type { PaintTypeOption } from "@/components/transactions/earn-form";

type ScanConfig = { redemption_threshold: number; redemption_value: number };

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AddPersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M3 12h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/customers", label: "Customers", icon: <PeopleIcon /> },
  { href: "/customers/new", label: "Add customer", icon: <AddPersonIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/customers/new") return pathname.startsWith("/customers/new");
  if (href === "/customers") {
    return (
      pathname === "/customers" ||
      (pathname.startsWith("/customers/") &&
        !pathname.startsWith("/customers/new"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  userEmail,
  paintTypes,
  config,
  logoUrl,
  brandColor,
  children,
}: {
  userEmail: string;
  paintTypes: PaintTypeOption[];
  config: ScanConfig;
  logoUrl: string | null;
  brandColor?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const logo = logoUrl || "/gpplus-mark.png";

  function openScan() {
    setDrawerOpen(false);
    setPendingBarcode(null);
    setScanOpen(true);
  }

  function closeScan() {
    setScanOpen(false);
    setPendingBarcode(null);
  }

  // Auto-open the scan popup when a hardware scanner fires and no field is focused.
  const handleGlobalScan = useCallback((code: string) => {
    setDrawerOpen(false);
    setPendingBarcode(code);
    setScanOpen(true);
  }, []);
  useGlobalScanner(handleGlobalScan);

  const sidebar = (
    <div className="flex h-full flex-col gap-7 p-5">
      <Link
        href="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-3 px-1 py-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="GP+" className="h-12 w-12 object-contain" />
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          GP+ Loyalty
        </span>
      </Link>

      <button
        type="button"
        onClick={openScan}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-contrast shadow-sm shadow-brand/25 transition-all hover:bg-brand-strong active:scale-[0.98]"
      >
        <ScanIcon />
        Scan a card
      </button>

      <nav className="flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted hover:bg-brand-soft/40 hover:text-foreground",
              ].join(" ")}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand"
                  aria-hidden
                />
              ) : null}
              <span
                className={
                  active
                    ? "text-brand"
                    : "text-muted transition-colors group-hover:text-foreground"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <p className="truncate px-3 text-xs text-muted" title={userEmail}>
          {userEmail}
        </p>
        <div className="mt-2">
          <ConfirmDialog
            title="Sign out?"
            description="You will need to sign in again to use the loyalty desk."
            confirmLabel="Sign out"
            onConfirm={() => logout()}
            trigger={
              <button
                type="button"
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-muted transition-colors hover:bg-brand-soft/40 hover:text-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path
                    d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign out
              </button>
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <LogoProvider value={logo}>
      {/* Per-org brand colour: overriding --brand cascades to every bg-brand,
          text-brand, etc. and the derived strong/soft shades (see globals.css). */}
      <div
        className="flex min-h-full"
        style={brandColor ? ({ "--brand": brandColor } as React.CSSProperties) : undefined}
      >
        {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-surface md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-border bg-surface shadow-xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="text-foreground"
          >
            <MenuIcon />
          </button>
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="GP+" className="h-7 w-7 object-contain" />
            <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
              GP+ Loyalty
            </span>
          </span>
          <button
            type="button"
            onClick={openScan}
            aria-label="Scan a card"
            className="text-brand"
          >
            <ScanIcon />
          </button>
        </header>

        <main
          key={pathname}
          className="w-full flex-1 animate-fade-up px-5 py-8 sm:px-8 lg:px-10"
        >
          {children}
        </main>
      </div>

        {scanOpen ? (
          <ScanModal
            onClose={closeScan}
            paintTypes={paintTypes}
            config={config}
            autoBarcode={pendingBarcode}
          />
        ) : null}
      </div>
    </LogoProvider>
  );
}
