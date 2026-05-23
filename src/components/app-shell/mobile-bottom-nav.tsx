"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon, type AppIconName } from "@/components/app-shell/app-icons";

interface MobileBottomNavProps {
  items: Array<{
    href: string;
    label: string;
    icon: AppIconName;
  }>;
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="app-mobile-nav lg:hidden" aria-label="Primary">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-mobile-nav-link ${active ? "app-mobile-nav-link-active" : ""}`.trim()}
          >
            <span className="text-[1.05rem]">
              <AppIcon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
