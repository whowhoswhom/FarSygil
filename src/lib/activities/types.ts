export interface ArchiveActivity {
  id: number;
  stravaId: number | null;
  name: string | null;
  sportType: string | null;
  startDate: string | null;
  startDateLocal: string | null;
  timezone: string | null;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  elapsedTimeSeconds: number | null;
  totalElevationGain: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  averageCadence: number | null;
  averageWatts: number | null;
  sufferScore: number | null;
  perceivedExertion: number | null;
  startLatitude: number | null;
  startLongitude: number | null;
  routePathData: string | null;
  source: string;
}

export interface ArchiveMetric {
  label: string;
  value: string;
  unit?: string;
}

export type ActivityRange = "30d" | "90d" | "365d" | "all";

export type ActivitySort =
  | "recent"
  | "oldest"
  | "distance"
  | "duration"
  | "elevation"
  | "effort";

export interface ActivityFilters {
  sport: string;
  range: ActivityRange;
  sort: ActivitySort;
  minDistanceMiles: number;
  search: string;
}

export interface ArchiveTotals {
  count: number;
  totalDistanceMeters: number;
  totalMovingTimeSeconds: number;
  totalElevationGain: number;
}
