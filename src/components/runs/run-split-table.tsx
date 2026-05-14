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
    <section className="surface-slab rounded-[28px] px-5 py-5 md:px-6">
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
        <div className="rounded-[22px] border border-white/6 bg-black/10 px-5 py-10 text-center">
          <p className="text-lg font-semibold text-[var(--ink-1)]">
            Data not available
          </p>
          <p className="mt-2 text-sm text-[var(--ink-3)]">
            Split rows appear here once detailed Strava split data has been
            imported into the local database.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-white/6 bg-black/10">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                <th className="px-4 py-4">Split</th>
                <th className="px-4 py-4">Distance</th>
                <th className="px-4 py-4">Pace</th>
                <th className="px-4 py-4">Elev Gain</th>
                <th className="px-4 py-4">HR</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split) => (
                <tr key={split.splitIndex} className="border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-4 text-sm font-semibold text-[var(--ink-1)]">
                    {split.splitIndex}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--ink-2)]">
                    {renderWithUnit(
                      formatSplitDistance(split.distanceMeters, unit),
                      unit,
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--ink-2)]">
                    {renderWithUnit(
                      formatSplitPace(split.averageSpeed, unit),
                      `/${unit}`,
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--ink-2)]">
                    {renderWithUnit(
                      formatRunElevationFeet(split.elevationDifference),
                      "ft",
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--ink-2)]">
                    {split.averageHeartrate != null
                      ? `${formatRunHeartrate(split.averageHeartrate)} bpm`
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function renderWithUnit(value: string, unit: string): string {
  return value === "--" ? value : `${value} ${unit}`;
}
