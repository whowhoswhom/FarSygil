"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STALE_SYNC_AFTER_MS = 12 * 60 * 60 * 1000;
const MIN_ATTEMPT_INTERVAL_MS = 30 * 60 * 1000;
const LAST_ATTEMPT_KEY = "farsygil:last-auto-strava-fresh-sync-at";

export function AutoStravaFreshSync({
  enabled,
  lastSyncedAt,
  blockedUntil,
}: {
  enabled: boolean;
  lastSyncedAt: string | null;
  blockedUntil: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (
      !enabled ||
      isAutoSyncBlocked(blockedUntil) ||
      !isSyncStale(lastSyncedAt)
    ) {
      return;
    }

    const lastAttempt = readLastAttempt();
    const now = Date.now();

    if (lastAttempt && now - lastAttempt < MIN_ATTEMPT_INTERVAL_MS) {
      return;
    }

    writeLastAttempt(now);

    let cancelled = false;

    void fetch("/api/strava/sync-fresh", {
      method: "POST",
      cache: "no-store",
    })
      .then((response) => {
        if (!cancelled && response.ok) {
          router.refresh();
        }
      })
      .catch(() => {
        // Manual sync controls on /connect surface the actionable error state.
      });

    return () => {
      cancelled = true;
    };
  }, [blockedUntil, enabled, lastSyncedAt, router]);

  return null;
}

function isAutoSyncBlocked(blockedUntil: string | null): boolean {
  if (!blockedUntil) {
    return false;
  }

  const blockedUntilTime = new Date(blockedUntil).getTime();

  if (Number.isNaN(blockedUntilTime)) {
    return false;
  }

  return Date.now() < blockedUntilTime;
}

function isSyncStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) {
    return true;
  }

  const lastSyncedTime = new Date(lastSyncedAt).getTime();

  if (Number.isNaN(lastSyncedTime)) {
    return true;
  }

  return Date.now() - lastSyncedTime > STALE_SYNC_AFTER_MS;
}

function readLastAttempt(): number | null {
  try {
    const value = window.sessionStorage.getItem(LAST_ATTEMPT_KEY);
    const timestamp = value ? Number(value) : NaN;
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

function writeLastAttempt(timestamp: number): void {
  try {
    window.sessionStorage.setItem(LAST_ATTEMPT_KEY, String(timestamp));
  } catch {
    // Some privacy modes disable sessionStorage; auto-sync still works once.
  }
}
