"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { StravaSyncLogEntry } from "@/server/strava/sync-logs";

interface SyncPanelProps {
  connected: boolean;
  logs: StravaSyncLogEntry[];
  coverage: {
    totalActivities: number;
    detailActivities: number;
    streamActivities: number;
  };
}

type SyncFeedback =
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    }
  | null;

type SyncAction = "fresh" | "summary" | "detail-incremental" | "detail-full";

export function SyncPanel({ connected, logs, coverage }: SyncPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<SyncFeedback>(null);
  const [pendingAction, setPendingAction] = useState<SyncAction | null>(null);
  const [isPending, startTransition] = useTransition();

  async function runSync(action: SyncAction) {
    setFeedback(null);
    setPendingAction(action);

    try {
      const request =
        action === "fresh"
          ? {
              url: "/api/strava/sync-fresh",
              body: undefined,
            }
          : action === "summary"
          ? {
              url: "/api/strava/sync",
              body: undefined,
            }
          : {
              url: "/api/strava/sync-details",
              body:
                action === "detail-full"
                  ? JSON.stringify({ mode: "full" })
                  : undefined,
            };
      const response = await fetch(request.url, {
        method: "POST",
        cache: "no-store",
        headers: request.body
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body: request.body,
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            activitiesAdded?: number;
            activitiesUpdated?: number;
            activitiesSynced?: number;
            detailsFetched?: number;
            streamsFetched?: number;
            summary?: {
              activitiesAdded?: number;
              activitiesUpdated?: number;
            };
            details?: {
              activitiesSynced?: number;
              detailsFetched?: number;
              streamsFetched?: number;
            } | null;
            dailyStress?: {
              daysWritten?: number;
            } | null;
            dailyStressError?: string | null;
          }
        | null;

      if (!response.ok) {
        setFeedback({
          kind: "error",
          message:
            payload?.message ??
            "Strava sync could not be completed. Check the local connection and try again.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        message:
          action === "fresh"
            ? formatFreshSyncSuccessMessage(payload)
            : action === "summary"
            ? formatSummarySyncSuccessMessage(
                payload?.activitiesAdded ?? 0,
                payload?.activitiesUpdated ?? 0,
              )
            : formatDetailSyncSuccessMessage(
                payload?.activitiesSynced ?? 0,
                payload?.detailsFetched ?? 0,
                payload?.streamsFetched ?? 0,
              ),
      });

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({
        kind: "error",
        message:
          "Strava sync could not be started from this browser session. Try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="dashboard-shell-card p-4 md:p-5">
      <div className="relative grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="section-kicker mb-1">Sync control</p>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
              Local sync
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-2)]">
              Fresh sync pulls new Strava activities, backfills missing detail
              rows, and recomputes local daily stress. Only direct Strava
              requests leave this machine.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
            <button
              type="button"
              onClick={() => void runSync("fresh")}
              disabled={!connected || isPending}
              className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "fresh" ? "Refreshing..." : "Refresh latest"}
            </button>
            <button
              type="button"
              onClick={() => void runSync("summary")}
              disabled={!connected || isPending}
              className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "summary" ? "Syncing..." : "Sync summary"}
            </button>
            <button
              type="button"
              onClick={() => void runSync("detail-incremental")}
              disabled={!connected || isPending}
              className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "detail-incremental"
                ? "Syncing..."
                : "Missing details"}
            </button>
            <button
              type="button"
              onClick={() => void runSync("detail-full")}
              disabled={!connected || isPending}
              className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "detail-full" ? "Refreshing..." : "All details"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricCell
              label="Archived"
              value={String(coverage.totalActivities)}
            />
            <MetricCell
              label="Details"
              value={`${coverage.detailActivities}/${coverage.totalActivities}`}
            />
            <MetricCell
              label="Streams"
              value={`${coverage.streamActivities}/${coverage.totalActivities}`}
            />
          </div>

          <SyncStatusOverview
            connected={connected}
            logs={logs}
            coverage={coverage}
          />

          {!connected ? (
            <p className="rounded-[16px] border border-white/6 bg-white/[0.02] px-4 py-3 text-xs text-[var(--ink-3)]">
              Connect Strava before starting a local sync.
            </p>
          ) : null}

          {feedback ? (
            <div
              role={feedback.kind === "error" ? "alert" : "status"}
              className={`rounded-[16px] border px-4 py-3 text-xs ${
                feedback.kind === "error"
                  ? "border-[var(--danger-soft)] bg-[rgba(229,102,74,0.08)] text-[var(--danger-ink)]"
                  : "border-[rgba(168,226,108,0.18)] bg-[rgba(123,194,65,0.08)] text-[var(--accent-bright)]"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[20px] border border-white/6 bg-black/10 p-3">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="section-kicker mb-1">Sync log</p>
              <h3 className="text-lg font-semibold tracking-[-0.04em] text-white">
                Recent events
              </h3>
            </div>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-[var(--ink-3)]">
              {logs.length} rows
            </span>
          </div>

          {logs.length > 0 ? (
            <div className="max-h-[25rem] space-y-2 overflow-y-auto pr-1">
              {logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-[16px] border border-white/6 bg-white/[0.02] px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <EventBadge eventType={log.eventType} />
                      <p className="truncate text-sm font-medium text-[var(--ink-1)]">
                        {formatEventLabel(log.eventType)}
                      </p>
                    </div>
                    <p className="text-[11px] text-[var(--ink-3)]">
                      {formatDateTime(log.startedAt)}
                    </p>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--ink-2)]">
                    {log.message ?? "No message recorded for this sync event."}
                  </p>

                  <dl className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6">
                    <MetricCell label="Source" value={log.source} />
                    <MetricCell
                      label="Added"
                      value={String(log.activitiesAdded)}
                    />
                    <MetricCell
                      label="Updated"
                      value={String(log.activitiesUpdated)}
                    />
                    <MetricCell label="Errors" value={String(log.errorsCount)} />
                    <MetricCell
                      label="Start"
                      value={formatDateTime(log.startedAt)}
                    />
                    <MetricCell
                      label="Done"
                      value={log.completedAt ? formatDateTime(log.completedAt) : "--"}
                    />
                  </dl>
                </article>
              ))}
            </div>
          ) : connected ? (
            <p className="rounded-[16px] border border-white/6 bg-white/[0.02] px-4 py-4 text-sm text-[var(--ink-3)]">
              No local sync events yet. Run your first Strava sync to populate
              this log.
            </p>
          ) : (
            <p className="rounded-[16px] border border-white/6 bg-white/[0.02] px-4 py-4 text-sm text-[var(--ink-3)]">
              Sync events appear here after Strava is connected.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function EventBadge({ eventType }: { eventType: string }) {
  const className =
    eventType === "sync_complete"
      ? "border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] text-[var(--accent-bright)]"
      : eventType === "sync_error"
        ? "border-[var(--danger-soft)] bg-[rgba(229,102,74,0.12)] text-[var(--danger-ink)]"
        : "border-white/10 bg-white/[0.04] text-[var(--ink-2)]";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {formatEventLabel(eventType)}
    </span>
  );
}

function SyncStatusOverview({
  connected,
  logs,
  coverage,
}: {
  connected: boolean;
  logs: StravaSyncLogEntry[];
  coverage: SyncPanelProps["coverage"];
}) {
  const latestSuccess = logs.find((log) => log.eventType === "sync_complete");
  const latestError = logs.find((log) => log.eventType === "sync_error");
  const rateLimitCooldown = getRateLimitCooldown(latestError, latestSuccess);
  const nextAction = getNextSyncAction({
    connected,
    latestSuccess,
    latestError,
    coverage,
    rateLimitCooldown,
  });

  return (
    <div className="grid gap-2">
      <MetricCell
        label="Last success"
        value={latestSuccess ? formatDateTime(latestSuccess.completedAt ?? latestSuccess.startedAt) : "--"}
      />
      <MetricCell
        label="Last error"
        value={latestError ? (latestError.message ?? "Sync error") : "--"}
      />
      {rateLimitCooldown ? (
        <div className="rounded-[14px] border border-[var(--danger-soft)] bg-[rgba(229,102,74,0.08)] px-3 py-3">
          <p className="mb-1 truncate text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-[var(--danger-ink)]">
            Auto-refresh paused
          </p>
          <p className="text-xs leading-relaxed text-[var(--ink-1)]">
            Strava returned a rate-limit response. Background freshness waits
            until about {formatDateTime(rateLimitCooldown.blockedUntil)}; manual
            refresh stays available.
          </p>
        </div>
      ) : null}
      <div className="rounded-[14px] border border-white/6 bg-black/10 px-3 py-3">
        <p className="mb-1 truncate text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
          Next action
        </p>
        <p className="text-xs leading-relaxed text-[var(--ink-1)]">
          {nextAction}
        </p>
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/6 bg-black/10 px-2.5 py-2">
      <p className="mb-1 truncate text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="truncate text-xs text-[var(--ink-1)]" title={value}>
        {value}
      </p>
    </div>
  );
}

function getNextSyncAction({
  connected,
  latestSuccess,
  latestError,
  coverage,
  rateLimitCooldown,
}: {
  connected: boolean;
  latestSuccess: StravaSyncLogEntry | undefined;
  latestError: StravaSyncLogEntry | undefined;
  coverage: SyncPanelProps["coverage"];
  rateLimitCooldown: { blockedUntil: string } | null;
}): string {
  if (!connected) {
    return "Connect Strava first.";
  }

  if (rateLimitCooldown) {
    return "Wait for the Strava rate-limit cooldown, then use Refresh latest. Background auto-refresh is paused until then.";
  }

  if (latestError && isLogNewerThan(latestError, latestSuccess)) {
    return "Use Refresh latest. If the error repeats, wait for Strava's rate limit window and try again.";
  }

  if (!latestSuccess) {
    return "Use Refresh latest to import your local Strava archive.";
  }

  if (
    coverage.totalActivities > 0 &&
    coverage.detailActivities < coverage.totalActivities
  ) {
    return "Use Missing details to backfill run splits and streams.";
  }

  return "Fresh sync runs automatically when stale; use Refresh latest after a new run.";
}

function getRateLimitCooldown(
  latestError: StravaSyncLogEntry | undefined,
  latestSuccess: StravaSyncLogEntry | undefined,
): { blockedUntil: string } | null {
  if (
    !latestError ||
    !isLogNewerThan(latestError, latestSuccess) ||
    !latestError.message ||
    !isStravaRateLimitMessage(latestError.message)
  ) {
    return null;
  }

  const errorTime = getLogTimestamp(latestError);

  if (!Number.isFinite(errorTime)) {
    return null;
  }

  return {
    blockedUntil: new Date(errorTime + 60 * 60 * 1000).toISOString(),
  };
}

function isStravaRateLimitMessage(message: string): boolean {
  return /rate limit|HTTP 429/i.test(message);
}

function isLogNewerThan(
  candidate: StravaSyncLogEntry,
  reference: StravaSyncLogEntry | undefined,
): boolean {
  if (!reference) {
    return true;
  }

  return getLogTimestamp(candidate) > getLogTimestamp(reference);
}

function getLogTimestamp(log: StravaSyncLogEntry): number {
  const value = Date.parse(log.completedAt ?? log.startedAt);
  return Number.isFinite(value) ? value : log.id;
}

function formatEventLabel(eventType: string): string {
  switch (eventType) {
    case "sync_start":
      return "Sync started";
    case "sync_complete":
      return "Sync complete";
    case "sync_error":
      return "Sync error";
    default:
      return eventType.replace(/_/g, " ");
  }
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatSummarySyncSuccessMessage(
  activitiesAdded: number,
  activitiesUpdated: number,
): string {
  if (activitiesAdded === 0 && activitiesUpdated === 0) {
    return "Summary sync complete. No new Strava activities were found.";
  }

  return `Summary sync complete. Added ${activitiesAdded} and updated ${activitiesUpdated} activities.`;
}

function formatFreshSyncSuccessMessage(payload: {
  summary?: {
    activitiesAdded?: number;
    activitiesUpdated?: number;
  };
  details?: {
    activitiesSynced?: number;
    detailsFetched?: number;
    streamsFetched?: number;
  } | null;
  dailyStress?: {
    daysWritten?: number;
  } | null;
  dailyStressError?: string | null;
} | null): string {
  const activitiesAdded = payload?.summary?.activitiesAdded ?? 0;
  const activitiesUpdated = payload?.summary?.activitiesUpdated ?? 0;
  const detailsSynced = payload?.details?.activitiesSynced ?? 0;
  const daysWritten = payload?.dailyStress?.daysWritten;
  const stressText = payload?.dailyStressError
    ? "daily stress recompute was deferred"
    : `recomputed ${daysWritten ?? 0} daily stress days`;

  return (
    `Fresh sync complete. Added ${activitiesAdded} and updated ` +
    `${activitiesUpdated} activities, refreshed ${detailsSynced} detail rows, ` +
    `and ${stressText}.`
  );
}

function formatDetailSyncSuccessMessage(
  activitiesSynced: number,
  detailsFetched: number,
  streamsFetched: number,
): string {
  if (activitiesSynced === 0) {
    return "Detail sync complete. No missing local detail rows were found.";
  }

  return `Detail sync complete. Refreshed ${activitiesSynced} runs, fetched ${detailsFetched} detail payloads, and wrote ${streamsFetched} stream payloads.`;
}
