"use client";

import { sportLabel } from "@/lib/activities/format";
import type { ActivityFilters, ActivitySort } from "@/lib/activities/types";

interface FilterHudProps {
  filters: ActivityFilters;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onPatchFilters: (patch: Partial<ActivityFilters>) => void;
  sportOptions: string[];
  maxDistanceMiles: number;
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
  onSearchDraftChange,
  onPatchFilters,
  sportOptions,
  maxDistanceMiles,
  visibleCount,
  totalCount,
}: FilterHudProps) {
  return (
    <div className="sticky top-0 z-30 -mt-6 px-5 pt-4 md:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="surface-slab rounded-full px-4 py-3 md:px-5" data-depth="rail">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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
            <div className="grid gap-3 md:grid-cols-[1.3fr_auto_auto] xl:min-w-[720px]">
              <label className="flex items-center gap-3 rounded-full border border-white/8 bg-black/10 px-4 py-2">
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
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <label className="flex items-center gap-3 rounded-full border border-white/8 bg-black/10 px-4 py-2">
              <span className="section-kicker whitespace-nowrap">Min miles</span>
              <input
                type="range"
                min={0}
                max={Math.max(maxDistanceMiles, 1)}
                step={1}
                value={Math.min(filters.minDistanceMiles, maxDistanceMiles)}
                onChange={(event) =>
                  onPatchFilters({
                    minDistanceMiles: Number(event.target.value),
                  })
                }
                className="w-full accent-[var(--accent-core)]"
              />
              <span className="tabular-nums text-sm text-white/80">
                {filters.minDistanceMiles}
              </span>
            </label>
            <p className="tabular-nums text-right text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              {visibleCount}/{totalCount}
            </p>
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
      className="rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em]"
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
