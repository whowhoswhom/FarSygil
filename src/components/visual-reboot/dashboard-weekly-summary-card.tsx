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
}: {
  title: string;
  subtitle: string;
  href?: string;
  items: WeeklySummaryItem[];
}) {
  return (
    <article className="dashboard-shell-card p-6 md:p-7">
      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-white">
              {title}
            </h2>
            <p className="mt-1 text-base text-[var(--ink-2)]">{subtitle}</p>
          </div>
          {href ? (
            <Link
              href={href}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
              aria-label={`Open ${title}`}
            >
              <AppIcon name="arrow-right" className="text-xl" />
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {items.map((item, index) => {
            const chart =
              item.chartValues && item.chartValues.length > 0
                ? item.chartType === "bar"
                  ? <MiniBarChart values={item.chartValues} tone={item.tone} />
                  : <MiniLineChart values={item.chartValues} tone={item.tone} />
                : null;

            return (
              <div
                key={item.label}
                className={`relative flex min-h-[220px] flex-col justify-between gap-5 px-2 py-1 ${index < items.length - 1 ? "lg:pr-6" : ""}`.trim()}
                style={dashboardToneVars(item.tone)}
              >
                {index < items.length - 1 ? (
                  <div className="dashboard-stat-divider absolute right-0 top-5 hidden h-[calc(100%-2.5rem)] lg:block" />
                ) : null}
                <div className="flex flex-col gap-5">
                  <MetricIconBadge tone={item.tone} icon={item.icon} />
                  <div>
                    <p className="text-[1.65rem] font-semibold tracking-[-0.035em] text-white">
                      {item.label}
                    </p>
                    {item.value ? (
                      <div className="mt-3 flex items-end gap-2">
                        <span
                          className="dashboard-tile-value text-[3.3rem] font-semibold"
                          style={{ color: "var(--dashboard-tone)" }}
                        >
                          {item.value}
                        </span>
                        {item.unit ? (
                          <span className="pb-2 text-[1.25rem] font-medium text-[var(--ink-2)]">
                            {item.unit}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-4">
                        <p className="text-sm font-semibold text-white">
                          Data not available
                        </p>
                        {item.emptyHint ? (
                          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">
                            {item.emptyHint}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-h-[4.25rem] rounded-[18px] border border-white/6 bg-black/10 px-2 py-2">
                  {chart}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
