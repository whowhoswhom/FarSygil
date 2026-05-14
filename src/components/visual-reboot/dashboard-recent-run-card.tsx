import Link from "next/link";

import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { SourceLabel } from "@/components/dashboard";
import { AppIcon } from "@/components/app-shell/app-icons";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardRecentRunCard({
  title,
  href,
  sportLabel,
  value,
  unit,
  detail,
  source,
  tone = "exercise",
  hint,
}: {
  title: string;
  href?: string;
  sportLabel: string;
  value: string | null;
  unit?: string;
  detail?: string;
  source: string;
  tone?: DashboardMetricTone;
  hint?: string;
}) {
  return (
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
            {title}
          </h3>
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

        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center justify-center">
            <MetricIconBadge tone={tone} icon="run" size="lg" />
          </div>
          <div className="min-w-0">
            <p className="text-[2rem] font-medium tracking-[-0.04em] text-white">
              {sportLabel}
            </p>
            {value ? (
              <div className="mt-3 flex items-end gap-2">
                <span
                  className="dashboard-tile-value text-[4rem] font-semibold"
                  style={{ color: "var(--metric-exercise)" }}
                >
                  {value}
                </span>
                {unit ? (
                  <span className="pb-2 text-[1.5rem] font-medium text-[var(--ink-2)]">
                    {unit}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-lg font-semibold text-white">
                Data not available
              </p>
            )}
            {hint ? (
              <p className="mt-2 text-sm text-[var(--ink-3)]">{hint}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            {detail ? (
              <p className="text-right text-[1.1rem] leading-snug text-[var(--ink-2)]">
                {detail}
              </p>
            ) : null}
            <SourceLabel source={source} tone="exercise" />
          </div>
        </div>
      </div>
    </article>
  );
}
