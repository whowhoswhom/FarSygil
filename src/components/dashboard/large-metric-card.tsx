import type { ReactNode } from "react";

import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { EmptyMetricState } from "@/components/dashboard/empty-metric-state";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { SourceLabel } from "@/components/dashboard/source-label";

interface LargeMetricCardProps {
  title: string;
  subtitle?: string;
  tone: DashboardMetricTone;
  source?: string;
  value?: string | null;
  unit?: string;
  hint?: string;
  chartType?: "bar" | "line";
  chartValues?: number[];
  children?: ReactNode;
  className?: string;
}

export function LargeMetricCard({
  title,
  subtitle,
  tone,
  source,
  value,
  unit,
  hint,
  chartType = "line",
  chartValues = [],
  children,
  className = "",
}: LargeMetricCardProps) {
  const hasValue = Boolean(value);
  const chart =
    chartValues.length > 0
      ? chartType === "bar"
        ? <MiniBarChart values={chartValues} tone={tone} />
        : <MiniLineChart values={chartValues} tone={tone} />
      : null;

  return (
    <article
      className={`surface-slab relative flex min-h-[320px] flex-col gap-8 rounded-[32px] px-6 py-6 sm:px-8 sm:py-8 ${className}`.trim()}
      data-depth="hero"
      style={dashboardToneVars(tone)}
    >
      <div className="dashboard-card-accent" />
      <div className="surface-rim" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="dashboard-accent-orb" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold tracking-[-0.045em] text-[var(--ink-1)] sm:text-[2rem]">
                  {title}
                </h3>
                {source ? <SourceLabel source={source} tone={tone} /> : null}
              </div>
              {subtitle ? (
                <p className="text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="dashboard-muted-divider" />
        {hasValue ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-end gap-3">
              <span
                className="dashboard-hero-value"
                style={{ color: "var(--dashboard-tone)" }}
              >
                {value}
              </span>
              {unit ? (
                <span className="pb-2 text-xl font-medium text-[var(--ink-2)]">
                  {unit}
                </span>
              ) : null}
            </div>
            {hint ? <p className="dashboard-surface-note">{hint}</p> : null}
            {chart ? <div className="dashboard-chart-frame">{chart}</div> : null}
          </div>
        ) : (
          <EmptyMetricState
            label={title}
            hint={hint}
            showLabel={false}
            className="max-w-xl"
          />
        )}
        {children ? <div className="relative">{children}</div> : null}
      </div>
    </article>
  );
}
