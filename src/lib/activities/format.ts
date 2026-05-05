import type {
  ArchiveActivity,
  ArchiveMetric,
  ArchiveTotals,
} from "@/lib/activities/types";

const RUN_LIKE_SPORTS = new Set(["Hike", "Run", "TrailRun", "VirtualRun", "Walk"]);
const RIDE_LIKE_SPORTS = new Set(["Ride", "VirtualRide", "GravelRide", "EBikeRide"]);
const EFFORT_BASED_SPORTS = new Set([
  "WeightTraining",
  "Workout",
  "Yoga",
  "StairStepper",
]);

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;

export function canonicalSport(sportType: string | null): string {
  if (sportType === "Workout") {
    return "WeightTraining";
  }

  return sportType ?? "Other";
}

export function sportLabel(sportType: string | null): string {
  switch (canonicalSport(sportType)) {
    case "TrailRun":
      return "Trail run";
    case "VirtualRun":
      return "Indoor run";
    case "VirtualRide":
      return "Indoor ride";
    case "WeightTraining":
      return "Strength";
    case "StairStepper":
      return "Stairs";
    default:
      return canonicalSport(sportType);
  }
}

export function isRunLike(sportType: string | null): boolean {
  return RUN_LIKE_SPORTS.has(canonicalSport(sportType));
}

export function isRideLike(sportType: string | null): boolean {
  return RIDE_LIKE_SPORTS.has(canonicalSport(sportType));
}

export function isEffortBased(sportType: string | null): boolean {
  return EFFORT_BASED_SPORTS.has(canonicalSport(sportType));
}

export function isIndoorActivity(activity: ArchiveActivity): boolean {
  if (activity.routePathData) {
    return false;
  }

  const sportType = canonicalSport(activity.sportType);

  return (
    sportType === "VirtualRun" ||
    sportType === "VirtualRide" ||
    sportType === "WeightTraining" ||
    sportType === "StairStepper" ||
    sportType === "Yoga" ||
    sportType === "Swim" ||
    (sportType === "Ride" &&
      (!activity.distanceMeters || activity.distanceMeters <= 0))
  );
}

export function formatDistanceMiles(meters: number | null): string {
  if (!meters || meters <= 0) {
    return "—";
  }

  const miles = meters / METERS_PER_MILE;
  return miles >= 100 ? `${miles.toFixed(0)} mi` : `${miles.toFixed(1)} mi`;
}

export function formatDistanceValueMiles(meters: number | null): string {
  if (!meters || meters <= 0) {
    return "—";
  }

  const miles = meters / METERS_PER_MILE;
  return miles >= 100 ? miles.toFixed(0) : miles.toFixed(1);
}

export function formatElevationFeet(meters: number | null): string {
  if (meters == null) {
    return "—";
  }

  return `${Math.round(meters / METERS_PER_FOOT).toLocaleString()} ft`;
}

export function formatElevationValueFeet(meters: number | null): string {
  if (meters == null) {
    return "—";
  }

  return `${Math.round(meters / METERS_PER_FOOT).toLocaleString()}`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "—";
  }

  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

export function formatDurationShort(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "—";
  }

  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}`;
  }

  return `${minutes}m`;
}

export function formatHours(seconds: number): string {
  if (seconds <= 0) {
    return "0h";
  }

  return `${(seconds / 3600).toFixed(1)}h`;
}

export function formatHeartrate(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}`;
}

export function formatPower(value: number | null): string {
  return value == null || value <= 0 ? "—" : `${Math.round(value)}`;
}

export function effortIntensity(activity: ArchiveActivity): number {
  if (typeof activity.sufferScore === "number" && activity.sufferScore > 0) {
    return Math.min(1, Math.max(0, activity.sufferScore / 250));
  }

  if (
    typeof activity.perceivedExertion === "number" &&
    activity.perceivedExertion > 0
  ) {
    return Math.min(1, Math.max(0, activity.perceivedExertion / 10));
  }

  return 0;
}

export function paceLabel(activity: ArchiveActivity): string {
  return isRunLike(activity.sportType) ? "Pace" : "Speed";
}

export function paceUnit(activity: ArchiveActivity): string {
  return isRunLike(activity.sportType) ? "/mi" : "mph";
}

export function formatPaceOrSpeed(activity: ArchiveActivity): string {
  if (
    !activity.distanceMeters ||
    activity.distanceMeters <= 0 ||
    !activity.movingTimeSeconds ||
    activity.movingTimeSeconds <= 0
  ) {
    return "—";
  }

  const miles = activity.distanceMeters / METERS_PER_MILE;

  if (isRunLike(activity.sportType)) {
    const secondsPerMile = activity.movingTimeSeconds / miles;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  const milesPerHour = miles / (activity.movingTimeSeconds / 3600);
  return milesPerHour.toFixed(1);
}

export function formatActivityDate(value: string | null): string {
  if (!value) {
    return "Undated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatMonthLabel(value: string | null): string {
  if (!value) {
    return "Undated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatArchiveCount(count: number): string {
  return `${count} ${count === 1 ? "effort" : "efforts"}`;
}

export function formatTotalsLine(totals: ArchiveTotals): string {
  return [
    formatArchiveCount(totals.count),
    formatDistanceMiles(totals.totalDistanceMeters),
    formatElevationFeet(totals.totalElevationGain),
  ].join(" · ");
}

export function primaryMetricFor(activity: ArchiveActivity): ArchiveMetric {
  if (isEffortBased(activity.sportType)) {
    return {
      label: "Duration",
      value: formatDurationShort(activity.movingTimeSeconds),
      unit: activity.movingTimeSeconds && activity.movingTimeSeconds >= 3600
        ? "hr"
        : "min",
    };
  }

  if (!activity.distanceMeters || activity.distanceMeters <= 0) {
    return {
      label: "Duration",
      value: formatDurationShort(activity.movingTimeSeconds),
    };
  }

  return {
    label: "Distance",
    value: formatDistanceValueMiles(activity.distanceMeters),
    unit: "mi",
  };
}

export function metricsFor(activity: ArchiveActivity): ArchiveMetric[] {
  if (isEffortBased(activity.sportType)) {
    return [
      {
        label: "Duration",
        value: formatDurationShort(activity.movingTimeSeconds),
      },
      {
        label: "Avg HR",
        value: formatHeartrate(activity.averageHeartrate),
        unit: activity.averageHeartrate == null ? undefined : "bpm",
      },
      {
        label: "Max HR",
        value: formatHeartrate(activity.maxHeartrate),
        unit: activity.maxHeartrate == null ? undefined : "bpm",
      },
    ];
  }

  if (
    isRideLike(activity.sportType) &&
    (!activity.distanceMeters || activity.distanceMeters <= 0)
  ) {
    return [
      {
        label: "Duration",
        value: formatDurationShort(activity.movingTimeSeconds),
      },
      {
        label: "Avg HR",
        value: formatHeartrate(activity.averageHeartrate),
        unit: activity.averageHeartrate == null ? undefined : "bpm",
      },
      {
        label: "Power",
        value: formatPower(activity.averageWatts),
        unit: activity.averageWatts == null ? undefined : "W",
      },
    ];
  }

  return [
    {
      label: "Distance",
      value: formatDistanceValueMiles(activity.distanceMeters),
      unit: activity.distanceMeters == null ? undefined : "mi",
    },
    {
      label: isRunLike(activity.sportType) ? "Moving" : paceLabel(activity),
      value: isRunLike(activity.sportType)
        ? formatDurationShort(activity.movingTimeSeconds)
        : formatPaceOrSpeed(activity),
      unit:
        isRunLike(activity.sportType) || formatPaceOrSpeed(activity) === "—"
          ? undefined
          : paceUnit(activity),
    },
    {
      label: isRunLike(activity.sportType) ? paceLabel(activity) : "Elevation",
      value: isRunLike(activity.sportType)
        ? formatPaceOrSpeed(activity)
        : formatElevationValueFeet(activity.totalElevationGain),
      unit:
        isRunLike(activity.sportType) || activity.totalElevationGain == null
          ? isRunLike(activity.sportType) && formatPaceOrSpeed(activity) !== "—"
            ? paceUnit(activity)
            : undefined
          : "ft",
    },
  ];
}

export function heroRailMetricsFor(activity: ArchiveActivity): ArchiveMetric[] {
  const baseMetrics = metricsFor(activity);

  const rail = [...baseMetrics];

  if (
    activity.averageHeartrate != null &&
    rail.every((metric) => metric.label !== "Avg HR")
  ) {
    rail.push({
      label: "Avg HR",
      value: formatHeartrate(activity.averageHeartrate),
      unit: "bpm",
    });
  }

  if (
    !isRunLike(activity.sportType) &&
    activity.totalElevationGain != null &&
    activity.totalElevationGain > 0 &&
    rail.every((metric) => metric.label !== "Elevation")
  ) {
    rail.push({
      label: "Elevation",
      value: formatElevationValueFeet(activity.totalElevationGain),
      unit: "ft",
    });
  }

  return rail.slice(0, 4);
}
