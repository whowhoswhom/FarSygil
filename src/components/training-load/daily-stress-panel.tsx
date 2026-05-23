"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { MiniLineChart } from "@/components/dashboard/mini-line-chart";

interface DailyStressPoint {
  date: string;
  dailyTrainingStress: number;
}

type RecomputeFeedback =
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    }
  | null;

export function DailyStressPanel({
  latest,
  series,
}: {
  latest: DailyStressPoint | null;
  series: DailyStressPoint[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<RecomputeFeedback>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const chartValues = series.map((point) => point.dailyTrainingStress);
  const recentStressPoints = series.slice(-5).reverse();
  const maxRecentStress = Math.max(
    ...recentStressPoints.map((point) => point.dailyTrainingStress),
    0,
  );

  async function recompute() {
    setFeedback(null);
    setIsRecomputing(true);

    try {
      const response = await fetch("/api/training-load/recompute", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            activitiesUsed?: number;
            daysWritten?: number;
          }
        | null;

      if (!response.ok) {
        setFeedback({
          kind: "error",
          message:
            payload?.message ??
            "Daily training stress could not be recomputed from local runs.",
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: `Daily training stress recomputed from ${
          payload?.activitiesUsed ?? 0
        } real runs across ${payload?.daysWritten ?? 0} days.`,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Daily training stress recompute could not be started.",
      });
    } finally {
      setIsRecomputing(false);
    }
  }

  return (
    <section className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker mb-1">Daily stress</p>
            <h2 className="text-[1.6rem] font-semibold tracking-[-0.045em] text-white md:text-[2rem]">
              Real local load input
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--ink-2)] md:text-sm">
              Uses Strava suffer score when present. Otherwise, it uses a
              conservative heart-rate and duration fallback when both fields are
              available on a real local run.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void recompute()}
            disabled={isRecomputing || isPending}
            className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 md:px-5 md:py-3 md:text-sm"
          >
            {isRecomputing || isPending ? "Computing..." : "Compute daily stress"}
          </button>
        </div>

        <div className="dashboard-mock-empty grid gap-3 p-3 md:grid-cols-[220px_minmax(0,1fr)] md:p-4">
          <div className="rounded-[16px] border border-white/6 bg-black/10 px-4 py-4">
            <p className="section-kicker mb-2">Latest</p>
            <div className="flex items-end gap-2">
              <span className="dashboard-tile-value text-[2.55rem] font-semibold text-white/82 md:text-[3rem]">
                {latest ? formatStress(latest.dailyTrainingStress) : "--"}
              </span>
              {latest ? (
                <span className="pb-1 text-sm text-[var(--ink-3)]">stress</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-[var(--ink-3)]">
              {latest?.date ?? "Data not available"}
            </p>

            <div className="mt-5 grid gap-2">
              <p className="section-kicker">Recent computed days</p>
              {recentStressPoints.length > 0 ? (
                <div className="grid gap-2">
                  {recentStressPoints.map((point) => {
                    const width =
                      maxRecentStress > 0
                        ? Math.max(
                            12,
                            (point.dailyTrainingStress / maxRecentStress) * 100,
                          )
                        : 0;

                    return (
                      <div
                        key={point.date}
                        className="grid grid-cols-[4.8rem_minmax(0,1fr)_3.2rem] items-center gap-2"
                      >
                        <span className="text-xs text-[var(--ink-3)]">
                          {formatDateLabel(point.date)}
                        </span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <span
                            className="block h-full rounded-full bg-[var(--metric-trend)] shadow-[0_0_18px_-7px_var(--metric-trend)]"
                            style={{ width: `${width}%` }}
                          />
                        </span>
                        <span className="dashboard-tile-value text-right text-sm font-semibold text-[var(--metric-trend)]">
                          {formatStress(point.dailyTrainingStress)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-[var(--ink-3)]">
                  No computed stress days yet.
                </p>
              )}
            </div>
          </div>

          <div className="min-h-36 rounded-[16px] border border-white/6 bg-black/10 px-3 py-3 md:px-4 md:py-4">
            {chartValues.length >= 2 ? (
              <MiniLineChart
                values={chartValues}
                tone="trend"
                className="min-h-28 md:min-h-32"
              />
            ) : (
              <div className="flex min-h-28 items-center justify-center text-center text-sm leading-relaxed text-[var(--ink-3)] md:min-h-32">
                Data not available until at least two days have real computed
                stress.
              </div>
            )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[var(--ink-3)] md:text-sm">
          ATL, CTL, TSB, ACWR, and recovery remain unavailable until the next
          analytics pass computes them from this daily stress input.
        </p>

        {feedback ? (
          <div
            role={feedback.kind === "error" ? "alert" : "status"}
            className={`rounded-[18px] border px-4 py-4 text-sm ${
              feedback.kind === "error"
                ? "border-[var(--danger-soft)] bg-[rgba(229,102,74,0.08)] text-[var(--danger-ink)]"
                : "border-[rgba(168,226,108,0.18)] bg-[rgba(123,194,65,0.08)] text-[var(--accent-bright)]"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatStress(value: number): string {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function formatDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  return `${Number(match[2])}/${Number(match[3])}`;
}
