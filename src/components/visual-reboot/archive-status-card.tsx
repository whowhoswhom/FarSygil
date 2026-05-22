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
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.035] text-[var(--ink-2)]"
            >
              <AppIcon name="archive" className="text-base" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                Archive Status
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-2)]">
                Local SQLite provenance
              </p>
            </div>
          </div>
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

        <div className="grid gap-3 sm:grid-cols-2">
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
          <ArchiveStatusMetric label="Latest Write" value={latestWrite ?? "--"} />
        </div>

        <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
          <p className="section-kicker mb-2">Database</p>
          <p className="break-all text-sm text-[var(--ink-2)]">
            {snapshot.databasePath ?? "Local SQLite"}
          </p>
        </div>

        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2">
            <ArchiveStatusMetric
              label="Detail Coverage"
              value={detailCoverage}
              detail="Detailed Strava payloads"
            />
            <ArchiveStatusMetric
              label="Stream Coverage"
              value={streamCoverage}
              detail="At least one stream payload"
            />
            <ArchiveStatusMetric
              label="Last Strava Sync"
              value={formatTimestamp(snapshot.latest.stravaSyncAt) ?? "--"}
            />
            <ArchiveStatusMetric
              label="Last Health Import"
              value={formatTimestamp(snapshot.latest.appleHealthImportAt) ?? "--"}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ArchiveStatusMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className="dashboard-tile-value text-[1.45rem] font-semibold text-white">
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

  const date = new Date(value);

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
