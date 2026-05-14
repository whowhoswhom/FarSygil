import Link from "next/link";

import {
  formatRunElevationFeet,
  formatRunHeartrate,
  formatSplitDistance,
  formatSplitPace,
  type SplitUnit,
} from "@/lib/runs/format";
import type { RunSplitSnapshot } from "@/server/runs/queries";

export function RunSplitTable({
  splits,
  unit,
  hrefBuilder,
}: {
  splits: RunSplitSnapshot[];
  unit: SplitUnit;
  hrefBuilder: (unit: SplitUnit) => string;
}) {
  return (
    <section className="dashboard-shell-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">Detail</p>
          <h2 className="ink-safe text-[2rem] font-semibold tracking-[-0.05em] text-white">
            Splits
          </h2>
        </div>
        <div className="liquid-pill inline-flex rounded-full p-1">
          {(["mi", "km"] as const).map((option) => {
            const active = option === unit;

            return (
              <Link
                key={option}
                href={hrefBuilder(option)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                  active
                    ? "bg-[var(--accent-core)] text-[#071005]"
                    : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                }`}
              >
                {option}
              </Link>
            );
          })}
        </div>
      </div>

      {splits.length === 0 ? (
        <div className="dashboard-mock-empty rounded-[22px] px-5 py-10 text-center">
          <p className="text-lg font-semibold text-[var(--ink-1)]">
            Data not available
          </p>
          <p className="mt-2 text-sm text-[var(--ink-3)]">
            Split rows appear here once detailed Strava split data has been
            imported into the local database.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-white/6 bg-black/10">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_88px_72px] gap-4 border-b border-white/6 px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)] md:grid-cols-[72px_120px_minmax(0,1fr)_108px_88px]">
            <span>{unit === "km" ? "KM" : "Mile"}</span>
            <span className="hidden md:block">Pace</span>
            <span className="md:hidden">Pace</span>
            <span />
            <span className="text-right">Elev Gain</span>
            <span className="text-right">HR</span>
          </div>

          <div className="divide-y divide-white/5">
            {splits.map((split) => {
              const pace = formatSplitPace(split.averageSpeed, unit);
              const distance = formatSplitDistance(split.distanceMeters, unit);
              const barWidth = buildPaceBarWidth(split.averageSpeed, splits);

              return (
                <div
                  key={split.splitIndex}
                  className="grid grid-cols-[56px_minmax(0,1fr)_88px_72px] items-center gap-4 px-4 py-3 md:grid-cols-[72px_120px_minmax(0,1fr)_108px_88px]"
                >
                  <span className="text-sm font-semibold text-[var(--ink-1)]">
                    {split.splitIndex}
                  </span>
                  <div className="flex flex-col gap-0.5 md:block">
                    <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--ink-3)] md:hidden">
                      {distance}
                    </span>
                    <span className="text-base font-medium text-[var(--metric-distance)]">
                      {pace === "--" ? pace : `${pace}`}
                    </span>
                  </div>
                  <div className="hidden h-[3px] rounded-full bg-white/[0.05] md:block">
                    <div
                      className="h-full rounded-full bg-[var(--metric-distance)] shadow-[0_0_18px_-6px_var(--metric-distance)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-right text-sm text-[var(--ink-2)]">
                    {renderWithUnit(
                      formatRunElevationFeet(split.elevationDifference),
                      "ft",
                    )}
                  </span>
                  <span className="text-right text-sm text-[var(--metric-cardio)]">
                    {split.averageHeartrate != null
                      ? formatRunHeartrate(split.averageHeartrate)
                      : "--"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function renderWithUnit(value: string, unit: string): string {
  return value === "--" ? value : `${value} ${unit}`;
}

function buildPaceBarWidth(
  averageSpeed: number | null,
  splits: RunSplitSnapshot[],
): number {
  const speeds = splits
    .map((split) => split.averageSpeed)
    .filter((value): value is number => typeof value === "number" && value > 0);

  if (
    averageSpeed == null ||
    averageSpeed <= 0 ||
    speeds.length < 2
  ) {
    return 72;
  }

  const min = Math.min(...speeds);
  const max = Math.max(...speeds);

  if (min === max) {
    return 82;
  }

  return 58 + ((averageSpeed - min) / (max - min)) * 42;
}
