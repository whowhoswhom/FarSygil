"use client";

import { sportLabel } from "@/lib/activities/format";
import type { ActivityFilters, ActivitySort } from "@/lib/activities/types";
import type { ThresholdMode } from "@/lib/activities/filters";

interface FilterHudProps {
  filters: ActivityFilters;
  searchDraft: string;
  distanceDraft: number;
  powerDraft: number;
  onSearchDraftChange: (value: string) => void;
  onDistanceDraftChange: (value: number) => void;
  onPowerDraftChange: (value: number) => void;
  onPatchFilters: (patch: Partial<ActivityFilters>) => void;
  sportOptions: string[];
  maxDistanceMiles: number;
  maxPowerWatts: number;
  thresholdMode: ThresholdMode;
  visibleCount: number;
  totalCount: number;
}

const SORT_OPTIONS: { value: ActivitySort; label: string }[] = [
  { value: "recent", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "distance", label: "Distance" },
  { value: "duration", label: "Duration" },
  { value: "elevation", label: "Elevation" },
  { value: "effort", label: "Effort" },
];

export function FilterHud({
  filters,
  searchDraft,
  distanceDraft,
  powerDraft,
  onSearchDraftChange,
  onDistanceDraftChange,
  onPowerDraftChange,
  onPatchFilters,
  sportOptions,
  maxDistanceMiles,
  maxPowerWatts,
  thresholdMode,
  visibleCount,
  totalCount,
}: FilterHudProps) {
  const thresholdLabel =
    thresholdMode === "power"
      ? "Min power"
      : thresholdMode === "distance"
        ? "Min miles"
        : null;
  const thresholdValue =
    thresholdMode === "power"
      ? String(Math.round(powerDraft))
      : thresholdMode === "distance"
        ? distanceDraft.toFixed(1)
        : null;
  const thresholdMax =
    thresholdMode === "power"
      ? Math.max(maxPowerWatts, 1)
      : Math.max(maxDistanceMiles, 0.1);
  const thresholdStep = thresholdMode === "power" ? 1 : 0.1;
  const thresholdInputValue =
    thresholdMode === "power" ? powerDraft : distanceDraft;

  return (
    <div className="sticky top-0 z-30 -mt-6 px-4 pt-4 md:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div
          className="surface-slab rounded-[30px] px-3 py-3 md:rounded-[34px] md:px-5 xl:rounded-full"
          data-depth="rail"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex min-w-max items-center gap-2">
                <FilterChip
                  active={filters.sport === "all"}
                  onClick={() => onPatchFilters({ sport: "all" })}
                >
                  All
                </FilterChip>
                {sportOptions.map((sport) => (
                  <FilterChip
                    key={sport}
                    active={filters.sport === sport}
                    onClick={() => onPatchFilters({ sport })}
                  >
                    {sportLabel(sport)}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.3fr_auto_auto] xl:min-w-[720px]">
              <label className="flex min-w-0 items-center gap-3 rounded-full border border-white/8 bg-black/10 px-4 py-2">
                <span className="section-kicker whitespace-nowrap">Search</span>
                <input
                  value={searchDraft}
                  onChange={(event) => onSearchDraftChange(event.target.value)}
                  placeholder="Name or sport"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </label>
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/10 px-4 py-2">
                <span className="section-kicker whitespace-nowrap">Range</span>
                <select
                  value={filters.range}
                  onChange={(event) =>
                    onPatchFilters({
                      range: event.target.value as ActivityFilters["range"],
                    })
                  }
                  className="bg-transparent text-sm text-white focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="365d">1 year</option>
                  <option value="90d">90 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/10 px-4 py-2">
                <span className="section-kicker whitespace-nowrap">Sort</span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    onPatchFilters({
                      sort: event.target.value as ActivitySort,
                    })
                  }
                  className="bg-transparent text-sm text-white focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div
            className={`mt-3 grid gap-3 ${thresholdMode === "none" ? "" : "md:grid-cols-[1fr_auto] md:items-center"}`}
          >
            {thresholdMode === "none" ? null : (
              <label className="rounded-[24px] border border-white/8 bg-black/10 px-4 py-3 sm:rounded-full sm:py-2">
                <div className="mb-2 flex items-center justify-between gap-3 sm:mb-0 sm:hidden">
                  <span className="section-kicker whitespace-nowrap">
                    {thresholdLabel}
                  </span>
                  <span className="ink-safe tabular-nums text-sm text-white/80">
                    {thresholdValue}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="section-kicker hidden whitespace-nowrap sm:inline">
                    {thresholdLabel}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={thresholdMax}
                    step={thresholdStep}
                    value={Math.min(thresholdInputValue, thresholdMax)}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (thresholdMode === "power") {
                        onPowerDraftChange(nextValue);
                        return;
                      }

                      onDistanceDraftChange(Number(nextValue.toFixed(1)));
                    }}
                    className="w-full accent-[var(--accent-core)]"
                  />
                  <span className="ink-safe tabular-nums hidden text-sm text-white/80 sm:inline">
                    {thresholdValue}
                  </span>
                </div>
              </label>
            )}
            <div
              className={`flex ${thresholdMode === "none" ? "justify-end" : "md:justify-end"} items-center`}
            >
              <p className="tabular-nums px-1 text-right text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
                {visibleCount}/{totalCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em]"
      style={
        active
          ? {
              color: "#071005",
              background: "var(--accent-bright)",
              boxShadow:
                "0 0 0 1px rgba(168,226,108,0.3), 0 0 22px -14px var(--accent-glow)",
            }
          : {
              color: "var(--ink-2)",
              background: "rgba(255,255,255,0.02)",
            }
      }
    >
      {children}
    </button>
  );
}
