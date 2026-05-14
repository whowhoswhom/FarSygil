import Link from "next/link";

import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { EmptyMetricState } from "@/components/dashboard/empty-metric-state";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { SourceLabel } from "@/components/dashboard";
import { AppIcon } from "@/components/app-shell/app-icons";
import type { AppIconName } from "@/components/app-shell/app-icons";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardMetricTile({
  title,
  tone,
  icon,
  source,
  value,
  unit,
  href,
  hint,
  chartValues = [],
}: {
  title: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  source?: string;
  value: string | null;
  unit?: string;
  href?: string;
  hint?: string;
  chartValues?: number[];
}) {
  return (
    <article className="dashboard-shell-card p-5" style={dashboardToneVars(tone)}>
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MetricIconBadge tone={tone} icon={icon} />
            <div>
              <h3 className="text-[1.55rem] font-medium tracking-[-0.035em] text-white">
                {title}
              </h3>
              {source ? <SourceLabel source={source} tone={tone} compact /> : null}
            </div>
          </div>
          {href ? (
            <Link
              href={href}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
              aria-label={`Open ${title}`}
            >
              <AppIcon name="arrow-right" className="text-xl" />
            </Link>
          ) : null}
        </div>

        {value ? (
          <>
            <div className="mt-auto flex items-end gap-2">
              <span
                className="dashboard-tile-value text-[3rem] font-semibold"
                style={{ color: "var(--dashboard-tone)" }}
              >
                {value}
              </span>
              {unit ? (
                <span className="pb-1 text-[1.2rem] font-medium text-[var(--ink-2)]">
                  {unit}
                </span>
              ) : null}
            </div>
            <div className="mt-auto rounded-[16px] border border-white/6 bg-black/10 px-2 py-2">
              {chartValues.length > 0 ? (
                <MiniLineChart values={chartValues} tone={tone} />
              ) : (
                <div className="h-[3.75rem]" />
              )}
            </div>
          </>
        ) : (
          <div className="my-auto">
            <EmptyMetricState
              label={title}
              hint={hint}
              compact
              showLabel={false}
            />
          </div>
        )}
      </div>
    </article>
  );
}
