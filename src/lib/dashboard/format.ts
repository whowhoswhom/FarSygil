import { metersToFeet, metersToMiles } from "@/lib/units";

export function formatDashboardTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatWeekRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "This week";
  }

  const startMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(end);
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export function formatDistanceValueMiles(meters: number): string {
  const miles = metersToMiles(meters);
  return miles >= 100 ? miles.toFixed(0) : miles.toFixed(2);
}

export function formatDurationCompact(seconds: number): string {
  if (seconds <= 0) {
    return "0m";
  }

  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m`;
}

export function formatPaceFromSecondsPerMile(
  secondsPerMile: number | null,
): string | null {
  if (secondsPerMile == null || secondsPerMile <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}'${seconds}"`;
}

export function formatPaceAxisLabel(secondsPerMile: number | null): string | null {
  const pace = formatPaceFromSecondsPerMile(secondsPerMile);
  return pace ? `${pace}` : null;
}

export function formatElevationFeetValue(meters: number): string {
  return `${Math.round(metersToFeet(meters)).toLocaleString()}`;
}

export function formatRoundedMetric(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)}`;
}

export function formatRunDayDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRunClockTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
