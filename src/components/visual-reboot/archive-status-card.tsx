import Link from "next/link";

import { AppIcon } from "@/components/app-shell/app-icons";
import type { ArchiveStatusSnapshot } from "@/server/archive/status";

interface ArchiveStatusCardProps {
  snapshot: ArchiveStatusSnapshot;
  href?: string;
  compact?: boolean;
}

export function ArchiveStatusCard({
  snapshot,
  href,
  compact = false,
}: ArchiveStatusCardProps) {
  const latestWrite = formatTimestamp(snapshot.latest.latestLocalWriteAt);
  const lastStravaSync = formatTimestamp(snapshot.latest.stravaSyncAt);
  const lastHealthImport = formatTimestamp(snapshot.latest.appleHealthImportAt);
  const detailCoverage = formatCoverage(
    snapshot.coverage.detailedActivities,
    snapshot.coverage.totalStravaActivities,
    snapshot.coverage.detailCoveragePercent,
  );
  const streamCoverage = formatCoverage(
    snapshot.coverage.streamActivities,
    snapshot.coverage.totalStravaActivities,
    snapshot.coverage.streamCoveragePercent,
  );

  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ArchiveIcon />
            <div className="min-w-0">
              <p className="section-kicker mb-1">Read-only</p>
              <h3 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                Archive Status
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                Local SQLite provenance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[rgba(168,226,108,0.18)] bg-[rgba(123,194,65,0.1)] px-3 py-1 text-xs font-medium text-[var(--accent-bright)]">
              No writes
            </span>
            {href ? (
              <Link
                href={href}
                className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
                aria-label="Open Archive"
              >
                <AppIcon name="arrow-right" className="text-base" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <ArchiveStatusMetric
            label="Activities"
            value={snapshot.counts.activities.toLocaleString()}
          />
          <ArchiveStatusMetric
            label="Health Rows"
            value={snapshot.counts.healthMetricRows.toLocaleString()}
          />
          <ArchiveStatusMetric
            label="Load Rows"
            value={snapshot.counts.trainingLoadRows.toLocaleString()}
          />
          <ArchiveStatusMetric label="Latest Write" value={latestWrite ?? "--"} compact />
        </div>

        <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
          <p className="section-kicker mb-2">Database</p>
          <p className="break-all text-sm text-[var(--ink-2)]">
            {snapshot.databasePath ?? "Local SQLite"}
          </p>
        </div>

        {!compact ? (
          <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[18px] border border-white/6 bg-black/10 p-3">
              <p className="section-kicker mb-3">Coverage</p>
              <div className="grid gap-3">
                <CoverageRow
                  label="Detail Coverage"
                  value={detailCoverage}
                  percent={snapshot.coverage.detailCoveragePercent}
                  detail="Detailed Strava payloads"
                />
                <CoverageRow
                  label="Stream Coverage"
                  value={streamCoverage}
                  percent={snapshot.coverage.streamCoveragePercent}
                  detail="At least one stream payload"
                />
              </div>
            </div>

            <div className="rounded-[18px] border border-white/6 bg-black/10 p-3">
              <p className="section-kicker mb-3">Latest local writes</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <LatestRow label="Strava sync" value={lastStravaSync ?? "--"} />
                <LatestRow
                  label="Health import"
                  value={lastHealthImport ?? "--"}
                />
                <LatestRow
                  label="Health metric date"
                  value={snapshot.latest.latestHealthMetricDate ?? "--"}
                />
                <LatestRow
                  label="Daily stress date"
                  value={snapshot.latest.latestDailyStressDate ?? "--"}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ArchiveIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.035] text-[var(--ink-2)]"
    >
      <AppIcon name="archive" className="text-base" />
    </span>
  );
}

function CoverageRow({
  label,
  value,
  percent,
  detail,
}: {
  label: string;
  value: string;
  percent: number | null;
  detail: string;
}) {
  const width = `${Math.max(0, Math.min(100, percent ?? 0))}%`;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-[var(--ink-3)]">{detail}</p>
        </div>
        <p className="text-sm font-semibold text-[var(--metric-distance)]">
          {value}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-[var(--metric-distance)]"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function LatestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/6 bg-white/[0.02] px-3 py-2">
      <p className="mb-1 truncate text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="truncate text-xs text-[var(--ink-1)]" title={value}>
        {value}
      </p>
    </div>
  );
}

function ArchiveStatusMetric({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string;
  value: string;
  detail?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p
        className={`dashboard-tile-value font-semibold text-white ${
          compact ? "text-[1rem] leading-tight tracking-[-0.04em]" : "text-[1.45rem]"
        }`}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">{detail}</p>
      ) : null}
    </div>
  );
}

function formatCoverage(
  value: number,
  total: number,
  percent: number | null,
): string {
  if (percent == null) {
    return "--";
  }

  return `${percent}% (${value}/${total})`;
}

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(normalizeArchiveTimestamp(value));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeArchiveTimestamp(value: string): string {
  const trimmed = value.trim();
  const sqliteDateTime =
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?$/;
  const sqliteDate = /^\d{4}-\d{2}-\d{2}$/;

  if (sqliteDateTime.test(trimmed)) {
    return trimmed.replace(" ", "T") + "Z";
  }

  if (sqliteDate.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }

  return trimmed;
}
