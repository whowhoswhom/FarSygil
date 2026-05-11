"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StravaSyncLogEntry } from "@/server/strava/sync-logs";

interface SyncPanelProps {
  connected: boolean;
  logs: StravaSyncLogEntry[];
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

export function SyncPanel({ connected, logs }: SyncPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<SyncFeedback>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSync() {
    setFeedback(null);

    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            activitiesAdded?: number;
            activitiesUpdated?: number;
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
        message: formatSyncSuccessMessage(
          payload?.activitiesAdded ?? 0,
          payload?.activitiesUpdated ?? 0,
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
    }
  }

  return (
    <section className="mt-6 rounded-[22px] border border-white/6 bg-black/10 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker mb-2">Sync log</p>
          <p className="max-w-2xl text-sm text-[var(--ink-2)]">
            Recent local sync attempts and outcomes. The archive stays on this
            machine; only direct Strava requests leave it.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={!connected || isPending}
          className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Syncing..." : "Sync now"}
        </button>
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
                  value={
                    log.completedAt ? formatDateTime(log.completedAt) : "—"
                  }
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

function formatSyncSuccessMessage(
  activitiesAdded: number,
  activitiesUpdated: number,
): string {
  if (activitiesAdded === 0 && activitiesUpdated === 0) {
    return "Sync complete. No new Strava activities were found.";
  }

  return `Sync complete. Added ${activitiesAdded} and updated ${activitiesUpdated} activities.`;
}
