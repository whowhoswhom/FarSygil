"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon, AppLogoMark, type AppIconName } from "@/components/app-shell/app-icons";

interface DesktopSidebarProps {
  items: Array<{
    href: string;
    label: string;
    icon: AppIconName;
  }>;
}

export function DesktopSidebar({ items }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-rail hidden lg:flex lg:w-[280px] lg:flex-col lg:justify-between">
      <div className="app-rail-panel">
        <div className="app-brand-lockup">
          <div className="flex items-center gap-4">
            <AppLogoMark className="h-8 w-12 flex-none" />
            <div>
              <p className="app-wordmark">FarSygil</p>
              <p className="app-submark">Local-first running command center</p>
            </div>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-3" aria-label="Primary">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-rail-link ${active ? "app-rail-link-active" : ""}`.trim()}
              >
                <span className="app-rail-icon">
                  <AppIcon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="app-rail-footer">
        <p className="section-kicker mb-3">FarSygil</p>
        <p className="text-sm text-[var(--ink-2)]">
          Single-user runtime. Local SQLite stays authoritative until you explicitly talk to Strava.
        </p>
      </div>
    </aside>
  );
}
