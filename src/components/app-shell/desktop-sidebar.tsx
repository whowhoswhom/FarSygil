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
    <aside className="app-rail hidden lg:flex lg:w-[244px] lg:flex-col lg:justify-between 2xl:w-[264px]">
      <div className="app-rail-panel">
        <div className="app-brand-lockup">
          <div className="flex items-center gap-3">
            <AppLogoMark className="h-7 w-10 flex-none" />
            <div>
              <p className="app-wordmark">FarSygil</p>
              <p className="app-submark">Local-first running command center</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-2" aria-label="Primary">
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
        <p className="section-kicker mb-2">FarSygil</p>
        <p className="text-xs leading-relaxed text-[var(--ink-2)]">
          Single-user runtime. Local SQLite stays authoritative until you explicitly talk to Strava.
        </p>
      </div>
    </aside>
  );
}
