"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { APPLE_HEALTH_DEFAULT_RELATIVE_PATH } from "@/lib/apple-health/constants";

interface AppleHealthImportPanelProps {
  metricRows: number;
  latestMetricDate: string | null;
  latestImport: {
    filename: string;
    importedAt: string;
    recordCount: number | null;
  } | null;
  latestLog: {
    eventType: string;
    message: string | null;
    startedAt: string;
  } | null;
}

type ImportFeedback =
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    }
  | null;

export function AppleHealthImportPanel({
  metricRows,
  latestMetricDate,
  latestImport,
  latestLog,
}: AppleHealthImportPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<ImportFeedback>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function runImport() {
    setFeedback(null);
    setIsImporting(true);

    try {
      const response = await fetch("/api/apple-health/import", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            recordsMatched?: number;
            metricsWritten?: number;
          }
        | null;

      if (!response.ok) {
        setFeedback({
          kind: "error",
          message:
            payload?.message ??
            "Apple Health import could not be completed from the local export.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: `Apple Health import complete. Matched ${
          payload?.recordsMatched ?? 0
        } records and wrote ${payload?.metricsWritten ?? 0} daily metric rows.`,
      });

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Apple Health import could not be started from this session.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="rounded-[22px] border border-white/6 bg-black/10 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">Import control</p>
          <h2 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
            Apple Health export
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void runImport()}
          disabled={isImporting || isPending}
          className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImporting || isPending ? "Importing..." : "Import local export"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCell label="Source file" value={APPLE_HEALTH_DEFAULT_RELATIVE_PATH} />
        <MetricCell label="Metric rows" value={String(metricRows)} />
        <MetricCell label="Latest metric" value={latestMetricDate ?? "--"} />
        <MetricCell
          label="Latest import"
          value={latestImport ? formatDateTime(latestImport.importedAt) : "--"}
        />
      </div>

      {latestImport ? (
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          Last file:{" "}
          <span className="text-[var(--ink-1)]">{latestImport.filename}</span>
          {typeof latestImport.recordCount === "number"
            ? ` | ${latestImport.recordCount} daily metric rows written`
            : ""}
        </p>
      ) : null}

      {latestLog ? (
        <p className="mt-2 text-sm text-[var(--ink-3)]">
          Last event:{" "}
          <span className="text-[var(--ink-1)]">
            {formatEventLabel(latestLog.eventType)}
          </span>
          {latestLog.message ? ` | ${latestLog.message}` : ""}
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
    </section>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className="break-words text-sm text-[var(--ink-1)]">{value}</p>
    </div>
  );
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatEventLabel(eventType: string): string {
  switch (eventType) {
    case "sync_complete":
      return "Import complete";
    case "sync_error":
      return "Import error";
    case "sync_start":
      return "Import started";
    default:
      return eventType.replace(/_/g, " ");
  }
}
