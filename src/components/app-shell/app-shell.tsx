import type { ReactNode } from "react";

import { DesktopSidebar } from "@/components/app-shell/desktop-sidebar";
import { MobileBottomNav } from "@/components/app-shell/mobile-bottom-nav";
import { TopStatusStrip } from "@/components/app-shell/top-status-strip";

export const DESKTOP_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/runs", label: "Runs", icon: "runs" as const },
  { href: "/archive", label: "Archive", icon: "archive" as const },
  { href: "/health", label: "Health", icon: "health" as const },
  { href: "/training-load", label: "Load", icon: "load" as const },
  { href: "/connect", label: "Connect", icon: "connect" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
];

export const MOBILE_ITEMS = DESKTOP_ITEMS.filter(
  (item) => item.href !== "/settings" && item.href !== "/archive",
);

interface AppShellProps {
  stravaLabel: string;
  stravaState: "connected" | "disconnected" | "pending" | "unavailable";
  healthLabel: string;
  healthState: "connected" | "disconnected" | "pending" | "unavailable";
  lastSyncedLabel: string | null;
  children: ReactNode;
}

export function AppShell({
  stravaLabel,
  stravaState,
  healthLabel,
  healthState,
  lastSyncedLabel,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell-root">
      <div className="app-shell-frame">
        <DesktopSidebar items={DESKTOP_ITEMS} />
        <div className="app-shell-main">
          <TopStatusStrip
            stravaLabel={stravaLabel}
            stravaState={stravaState}
            healthLabel={healthLabel}
            healthState={healthState}
            lastSyncedLabel={lastSyncedLabel}
          />
          <div className="app-shell-content">{children}</div>
        </div>
      </div>
      <MobileBottomNav items={MOBILE_ITEMS} />
    </div>
  );
}
