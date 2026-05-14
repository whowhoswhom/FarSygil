import type { ArchiveActivity } from "@/lib/activities/types";
import {
  METERS_PER_KILOMETER,
  METERS_PER_MILE,
  metersToFeet,
  metersToMiles,
} from "@/lib/units";

export type SplitUnit = "mi" | "km";

export function formatRunDistanceValue(meters: number | null): string | null {
  if (!isPositiveNumber(meters)) {
    return null;
  }

  const miles = metersToMiles(meters);
  return miles >= 100 ? miles.toFixed(0) : miles.toFixed(1);
}

export function formatRunDistance(meters: number | null): string {
  return withUnit(formatRunDistanceValue(meters), "mi");
}

export function formatRunDuration(seconds: number | null): string {
  if (!isPositiveNumber(seconds)) {
    return "--";
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

export function formatRunDurationShort(seconds: number | null): string {
  if (!isPositiveNumber(seconds)) {
    return "--";
  }

  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m`;
}

export function formatRunPaceFromActivity(activity: ArchiveActivity): string | null {
  if (!isPositiveNumber(activity.distanceMeters) || !isPositiveNumber(activity.movingTimeSeconds)) {
    return null;
  }

  return formatPaceSeconds(
    activity.movingTimeSeconds / (activity.distanceMeters / METERS_PER_MILE),
  );
}

export function formatRunPaceFromSpeed(
  metersPerSecond: number | null,
  unit: SplitUnit = "mi",
): string | null {
  if (!isPositiveNumber(metersPerSecond)) {
    return null;
  }

  const metersPerUnit = unit === "km" ? METERS_PER_KILOMETER : METERS_PER_MILE;
  return formatPaceSeconds(metersPerUnit / metersPerSecond);
}

export function formatRunHeartrate(value: number | null): string {
  if (!isPositiveNumber(value)) {
    return "--";
  }

  return `${Math.round(value)}`;
}

export function formatRunElevationFeet(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) {
    return "--";
  }

  return `${Math.round(metersToFeet(meters)).toLocaleString()}`;
}

export function formatRunDate(value: string | null): string {
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

export function formatRunDateTime(value: string | null): string {
  if (!value) {
    return "Undated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatSplitDistance(
  meters: number | null,
  unit: SplitUnit,
): string {
  if (!isPositiveNumber(meters)) {
    return "--";
  }

  const divisor = unit === "km" ? METERS_PER_KILOMETER : METERS_PER_MILE;
  const value = meters / divisor;
  return value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

export function formatSplitPace(
  averageSpeed: number | null,
  unit: SplitUnit,
): string {
  return formatRunPaceFromSpeed(averageSpeed, unit) ?? "--";
}

function formatPaceSeconds(secondsPerUnit: number): string | null {
  if (!Number.isFinite(secondsPerUnit) || secondsPerUnit <= 0) {
    return null;
  }

  const rounded = Math.round(secondsPerUnit);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function withUnit(value: string | null, unit: string): string {
  return value ? `${value} ${unit}` : "--";
}

function isPositiveNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
