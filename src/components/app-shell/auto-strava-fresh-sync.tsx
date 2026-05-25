"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STALE_SYNC_AFTER_MS = 12 * 60 * 60 * 1000;
const MIN_ATTEMPT_INTERVAL_MS = 30 * 60 * 1000;
const LAST_ATTEMPT_KEY = "farsygil:last-auto-strava-fresh-sync-at";

export function AutoStravaFreshSync({
  enabled,
  lastSyncedAt,
}: {
  enabled: boolean;
  lastSyncedAt: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !isSyncStale(lastSyncedAt)) {
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
  }, [enabled, lastSyncedAt, router]);

  return null;
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
