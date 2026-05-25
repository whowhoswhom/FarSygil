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
            };
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
    <section className="mt-6 rounded-[22px] border border-white/6 bg-black/10 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker mb-2">Sync control</p>
          <p className="max-w-2xl text-sm text-[var(--ink-2)]">
            Fresh sync pulls new Strava activities, backfills missing detail
            rows, and recomputes local daily stress. Only direct Strava
            requests leave this machine.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runSync("fresh")}
            disabled={!connected || isPending}
            className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "fresh" ? "Refreshing..." : "Refresh latest"}
          </button>
          <button
            type="button"
            onClick={() => void runSync("summary")}
            disabled={!connected || isPending}
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "summary" ? "Syncing..." : "Sync summary"}
          </button>
          <button
            type="button"
            onClick={() => void runSync("detail-incremental")}
            disabled={!connected || isPending}
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "detail-incremental"
              ? "Syncing details..."
              : "Sync missing details"}
          </button>
          <button
            type="button"
            onClick={() => void runSync("detail-full")}
            disabled={!connected || isPending}
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "detail-full"
              ? "Refreshing details..."
              : "Sync all details"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCell
          label="Archived runs"
          value={String(coverage.totalActivities)}
        />
        <MetricCell
          label="Detailed rows"
          value={`${coverage.detailActivities}/${coverage.totalActivities}`}
        />
        <MetricCell
          label="Stream rows"
          value={`${coverage.streamActivities}/${coverage.totalActivities}`}
        />
      </div>

      {!connected ? (
        <p className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-4 text-sm text-[var(--ink-3)]">
          Connect Strava before starting a local sync.
        </p>
      ) : null}

      {feedback ? (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`mt-4 rounded-[18px] border px-4 py-4 text-sm ${
            feedback.kind === "error"
              ? "border-[var(--danger-soft)] bg-[rgba(229,102,74,0.08)] text-[var(--danger-ink)]"
              : "border-[rgba(168,226,108,0.18)] bg-[rgba(123,194,65,0.08)] text-[var(--accent-bright)]"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div className="mt-4 space-y-3">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <EventBadge eventType={log.eventType} />
                  <p className="text-sm font-medium text-[var(--ink-1)]">
                    {formatEventLabel(log.eventType)}
                  </p>
                </div>
                <p className="text-xs text-[var(--ink-3)]">
                  {formatDateTime(log.startedAt)}
                </p>
              </div>

              <p className="mt-3 text-sm text-[var(--ink-2)]">
                {log.message ?? "No message recorded for this sync event."}
              </p>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCell label="Source" value={log.source} />
                <MetricCell label="Added" value={String(log.activitiesAdded)} />
                <MetricCell
                  label="Updated"
                  value={String(log.activitiesUpdated)}
                />
                <MetricCell label="Errors" value={String(log.errorsCount)} />
                <MetricCell
                  label="Started"
                  value={formatDateTime(log.startedAt)}
                />
                <MetricCell
                  label="Completed"
                  value={log.completedAt ? formatDateTime(log.completedAt) : "--"}
                />
              </dl>
            </article>
          ))}
        </div>
      ) : connected ? (
        <p className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-4 text-sm text-[var(--ink-3)]">
          No local sync events yet. Run your first Strava sync to populate this
          log.
        </p>
      ) : null}
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
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${className}`}
    >
      {formatEventLabel(eventType)}
    </span>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className="text-sm text-[var(--ink-1)]">{value}</p>
    </div>
  );
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
  };
} | null): string {
  const activitiesAdded = payload?.summary?.activitiesAdded ?? 0;
  const activitiesUpdated = payload?.summary?.activitiesUpdated ?? 0;
  const detailsSynced = payload?.details?.activitiesSynced ?? 0;
  const daysWritten = payload?.dailyStress?.daysWritten ?? 0;

  return (
    `Fresh sync complete. Added ${activitiesAdded} and updated ` +
    `${activitiesUpdated} activities, refreshed ${detailsSynced} detail rows, ` +
    `and recomputed ${daysWritten} daily stress days.`
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
