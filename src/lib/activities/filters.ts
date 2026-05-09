import { computeArchiveTotals } from "@/lib/activities/aggregates";
import {
  canonicalSport,
  effortIntensity,
  formatMonthLabel,
  isRideLike,
} from "@/lib/activities/format";
import type {
  ActivityFilters,
  ActivityRange,
  ActivitySort,
  ArchiveActivity,
  ArchiveTotals,
} from "@/lib/activities/types";

export const VALID_RANGES: readonly ActivityRange[] = [
  "30d",
  "90d",
  "365d",
  "all",
] as const;

export const VALID_SORTS: readonly ActivitySort[] = [
  "recent",
  "oldest",
  "distance",
  "duration",
  "elevation",
  "effort",
] as const;

export const DEFAULT_FILTERS: ActivityFilters = {
  sport: "all",
  range: "all",
  sort: "recent",
  minDistanceMiles: 0,
  minPowerWatts: 0,
  search: "",
};

export type ThresholdMode = "distance" | "power" | "none";

export interface ArchiveMonthGroup {
  key: string;
  label: string;
  totals: ArchiveTotals;
  activities: ArchiveActivity[];
}

export function getSportOptions(activities: ArchiveActivity[]): string[] {
  return Array.from(
    new Set(
      activities
        .map((activity) => canonicalSport(activity.sportType))
        .filter((sport) => sport !== "StairStepper"),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function getMaxDistanceMiles(activities: ArchiveActivity[]): number {
  const maxDistanceMeters = Math.max(
    0,
    ...activities.map((activity) => activity.distanceMeters ?? 0),
  );

  return Math.ceil(maxDistanceMeters / 1609.344);
}

export function getMaxPowerWatts(activities: ArchiveActivity[]): number {
  const maxPower = Math.max(
    0,
    ...activities
      .filter((activity) => isRideLike(activity.sportType))
      .map((activity) => activity.averageWatts ?? 0),
  );

  return Math.ceil(maxPower);
}

export function getThresholdMode(sport: string): ThresholdMode {
  if (sport === "all") {
    return "distance";
  }

  if (sport === "WeightTraining" || sport === "Yoga" || sport === "StairStepper") {
    return "none";
  }

  if (isRideLike(sport)) {
    return "power";
  }

  return "distance";
}

export function parseActivityFilters(
  searchParams: URLSearchParams,
  sportOptions: string[],
): ActivityFilters {
  const range = searchParams.get("range");
  const sort = searchParams.get("sort");
  const sport = searchParams.get("sport");
  const minDistanceMiles = Number(searchParams.get("minDistanceMiles") ?? "0");
  const minPowerWatts = Number(searchParams.get("minPowerWatts") ?? "0");
  const search = searchParams.get("search")?.trim() ?? "";

  return {
    sport:
      sport && (sport === "all" || sportOptions.includes(sport))
        ? sport
        : DEFAULT_FILTERS.sport,
    range: VALID_RANGES.includes(range as ActivityRange)
      ? (range as ActivityRange)
      : DEFAULT_FILTERS.range,
    sort: VALID_SORTS.includes(sort as ActivitySort)
      ? (sort as ActivitySort)
      : DEFAULT_FILTERS.sort,
    minDistanceMiles: Number.isFinite(minDistanceMiles)
      ? Math.max(0, minDistanceMiles)
      : DEFAULT_FILTERS.minDistanceMiles,
    minPowerWatts: Number.isFinite(minPowerWatts)
      ? Math.max(0, minPowerWatts)
      : DEFAULT_FILTERS.minPowerWatts,
    search,
  };
}

export function buildFilterSearchParams(
  filters: ActivityFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (filters.sport !== DEFAULT_FILTERS.sport) {
    searchParams.set("sport", filters.sport);
  }

  if (filters.range !== DEFAULT_FILTERS.range) {
    searchParams.set("range", filters.range);
  }

  if (filters.sort !== DEFAULT_FILTERS.sort) {
    searchParams.set("sort", filters.sort);
  }

  if (filters.minDistanceMiles > DEFAULT_FILTERS.minDistanceMiles) {
    searchParams.set("minDistanceMiles", String(filters.minDistanceMiles));
  }

  if (filters.minPowerWatts > DEFAULT_FILTERS.minPowerWatts) {
    searchParams.set("minPowerWatts", String(filters.minPowerWatts));
  }

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  return searchParams;
}

export function applyActivityFilters(
  activities: ArchiveActivity[],
  filters: ActivityFilters,
): ArchiveActivity[] {
  const now = Date.now();
  const cutoff =
    filters.range === "all"
      ? null
      : now -
        (filters.range === "30d"
          ? 30
          : filters.range === "90d"
            ? 90
            : 365) *
          86_400_000;
  const search = filters.search.toLowerCase();

  const filtered = activities.filter((activity) => {
    const activitySport = canonicalSport(activity.sportType);
    const timestamp = getActivityTimestamp(activity.startDate);
    const miles = (activity.distanceMeters ?? 0) / 1609.344;
    const averageWatts = activity.averageWatts ?? 0;
    const thresholdMode = getThresholdMode(filters.sport);

    if (filters.sport !== "all" && activitySport !== filters.sport) {
      return false;
    }

    if (cutoff != null && timestamp < cutoff) {
      return false;
    }

    if (thresholdMode === "distance" && miles < filters.minDistanceMiles) {
      return false;
    }

    if (thresholdMode === "power" && averageWatts < filters.minPowerWatts) {
      return false;
    }

    if (
      search &&
      !(activity.name ?? "").toLowerCase().includes(search) &&
      !activitySport.toLowerCase().includes(search)
    ) {
      return false;
    }

    return true;
  });

  return filtered.sort((left, right) => compareActivities(left, right, filters.sort));
}

export function groupActivitiesByMonth(
  activities: ArchiveActivity[],
): ArchiveMonthGroup[] {
  const groups = new Map<string, ArchiveActivity[]>();

  for (const activity of activities) {
    const key = activity.startDate?.slice(0, 7) ?? "undated";
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(activity);
      continue;
    }

    groups.set(key, [activity]);
  }

  return Array.from(groups.entries()).map(([key, monthActivities]) => ({
    key,
    label: formatMonthLabel(monthActivities[0]?.startDate ?? null),
    totals: computeArchiveTotals(monthActivities),
    activities: monthActivities,
  }));
}

function compareActivities(
  left: ArchiveActivity,
  right: ArchiveActivity,
  sort: ActivitySort,
): number {
  switch (sort) {
    case "oldest":
      return getActivityTimestamp(left.startDate) - getActivityTimestamp(right.startDate);
    case "distance":
      return (right.distanceMeters ?? 0) - (left.distanceMeters ?? 0);
    case "duration":
      return (right.movingTimeSeconds ?? 0) - (left.movingTimeSeconds ?? 0);
    case "elevation":
      return (right.totalElevationGain ?? 0) - (left.totalElevationGain ?? 0);
    case "effort":
      return effortIntensity(right) - effortIntensity(left);
    case "recent":
    default:
      return getActivityTimestamp(right.startDate) - getActivityTimestamp(left.startDate);
  }
}

function getActivityTimestamp(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}
