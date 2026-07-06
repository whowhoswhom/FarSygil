import Link from "next/link";

import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { AppIcon } from "@/components/app-shell/app-icons";
import type { AppIconName } from "@/components/app-shell/app-icons";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

interface WeeklySummaryItem {
  label: string;
  value: string | null;
  unit?: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  chartValues?: number[];
  chartType?: "bar" | "line";
  emptyHint?: string;
}

export function DashboardWeeklySummaryCard({
  title,
  subtitle,
  href,
  items,
  weekNavigation,
}: {
  title: string;
  subtitle: string;
  href?: string;
  items: WeeklySummaryItem[];
  weekNavigation?: {
    previousHref: string;
    nextHref: string | null;
    currentHref: string;
    isCurrentWeek: boolean;
  };
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.045em] text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {weekNavigation ? (
              <nav
                className="flex items-center gap-1 rounded-full border border-white/8 bg-black/15 p-1"
                aria-label="Dashboard week navigation"
              >
                <Link
                  href={weekNavigation.previousHref}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-white/[0.07] hover:text-white"
                  aria-label="Previous week"
                >
                  <AppIcon name="arrow-right" className="rotate-180 text-sm" />
                </Link>
                <Link
                  href={weekNavigation.currentHref}
                  className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
                    weekNavigation.isCurrentWeek
                      ? "bg-[var(--accent-core)] text-black"
                      : "text-[var(--ink-2)] hover:bg-white/[0.07] hover:text-white"
                  }`}
                  aria-current={weekNavigation.isCurrentWeek ? "date" : undefined}
                >
                  Current
                </Link>
                {weekNavigation.nextHref ? (
                  <Link
                    href={weekNavigation.nextHref}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-white/[0.07] hover:text-white"
                    aria-label="Next week"
                  >
                    <AppIcon name="arrow-right" className="text-sm" />
                  </Link>
                ) : (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/20"
                    aria-label="Next week unavailable"
                    aria-disabled="true"
                  >
                    <AppIcon name="arrow-right" className="text-sm" />
                  </span>
                )}
              </nav>
            ) : null}
            {href ? (
              <Link
                href={href}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
                aria-label={`Open ${title}`}
              >
                <AppIcon name="arrow-right" className="text-lg" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-0">
          {items.map((item, index) => {
            const chart =
              item.chartValues && item.chartValues.length > 0
                ? item.chartType === "bar"
                  ? <MiniBarChart values={item.chartValues} tone={item.tone} />
                  : item.chartValues.length >= 2
                    ? <MiniLineChart values={item.chartValues} tone={item.tone} />
                    : null
                : null;

            return (
              <div
                key={item.label}
                className={`relative flex min-h-[112px] flex-col justify-between gap-3 px-2 py-1 md:min-h-[132px] ${index < items.length - 1 ? "pr-3 md:pr-5" : ""}`.trim()}
                style={dashboardToneVars(item.tone)}
              >
                {index < items.length - 1 ? (
                  <div className="dashboard-stat-divider absolute right-0 top-4 h-[calc(100%-2rem)]" />
                ) : null}
                <div className="flex flex-col gap-3">
                  <MetricIconBadge tone={item.tone} icon={item.icon} size="sm" />
                  <div>
                    <p className="text-xs font-semibold tracking-[-0.01em] text-white md:text-base">
                      {item.label}
                    </p>
                    {item.value ? (
                      <div className="mt-2 flex items-end gap-1.5">
                        <span
                          className="dashboard-tile-value text-[1.45rem] font-semibold md:text-[2.7rem]"
                          style={{ color: "var(--dashboard-tone)" }}
                        >
                          {item.value}
                        </span>
                        {item.unit ? (
                          <span className="pb-0.5 text-[0.65rem] font-medium text-[var(--ink-2)] md:pb-1 md:text-base">
                            {item.unit}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="dashboard-tile-value text-[1.45rem] font-semibold text-[var(--ink-3)] md:text-[2.7rem]">
                          --
                        </p>
                        {item.emptyHint ? (
                          <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-[var(--ink-3)] md:text-xs">
                            {item.emptyHint}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                {chart ? (
                  <div className="h-9 rounded-[12px] border border-white/6 bg-black/10 px-1.5 py-1.5 md:h-12 md:px-2">
                    {chart}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
