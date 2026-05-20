import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { activities, trainingLoad } from "@/db/schema";
import { RUN_SPORTS } from "@/lib/strava/run-sports";
import type { FarSygilDatabase } from "@/server/strava/oauth";

const TRAINING_STRESS_BATCH_SIZE = 100;
const REFERENCE_HARD_EFFORT_HEART_RATE = 180;
const REFERENCE_HOURLY_STRESS = 100;

interface TrainingLoadActivityRow {
  id: number;
  startDate: string | null;
  startDateLocal: string | null;
  movingTimeSeconds: number | null;
  averageHeartrate: number | null;
  sufferScore: number | null;
}

export interface DailyTrainingStressRecomputeResult {
  activitiesScanned: number;
  activitiesUsed: number;
  daysWritten: number;
  startDate: string | null;
  endDate: string | null;
}

export interface DailyTrainingStressSnapshot {
  latest: {
    date: string;
    dailyTrainingStress: number;
  } | null;
  series: Array<{
    date: string;
    dailyTrainingStress: number;
  }>;
}

export async function recomputeDailyTrainingStress(
  database: FarSygilDatabase,
): Promise<DailyTrainingStressRecomputeResult> {
  const activityRows = await database
    .select({
      id: activities.id,
      startDate: activities.startDate,
      startDateLocal: activities.startDateLocal,
      movingTimeSeconds: activities.movingTimeSeconds,
      averageHeartrate: activities.averageHeartrate,
      sufferScore: activities.sufferScore,
    })
    .from(activities)
    .where(
      and(
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
      ),
    );
  const dailyStress = new Map<string, number>();
  let activitiesUsed = 0;
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (const row of activityRows) {
    const date = getLocalDateKey(row.startDateLocal ?? row.startDate);
    const stress = calculateActivityTrainingStress(row);

    if (!date || stress === null) {
      continue;
    }

    activitiesUsed += 1;
    startDate = minDate(startDate, date);
    endDate = maxDate(endDate, date);
    dailyStress.set(date, (dailyStress.get(date) ?? 0) + stress);
  }

  const rows = [...dailyStress.entries()]
    .map(([date, dailyTrainingStress]) => ({
      date,
      dailyTrainingStress: roundStress(dailyTrainingStress),
      acuteLoad: null,
      chronicLoad: null,
      trainingStressBalance: null,
      updatedAt: sql`(datetime('now'))`,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
  let daysWritten = 0;

  await database.transaction(async (transaction) => {
    await transaction
      .update(trainingLoad)
      .set({
        dailyTrainingStress: null,
        updatedAt: sql`(datetime('now'))`,
      });

    if (rows.length > 0) {
      for (let index = 0; index < rows.length; index += TRAINING_STRESS_BATCH_SIZE) {
        const batch = rows.slice(index, index + TRAINING_STRESS_BATCH_SIZE);
        const writtenRows = await transaction
          .insert(trainingLoad)
          .values(batch)
          .onConflictDoUpdate({
            target: trainingLoad.date,
            set: {
              dailyTrainingStress: sql`excluded.daily_training_stress`,
              updatedAt: sql`(datetime('now'))`,
            },
          })
          .returning({
            id: trainingLoad.id,
          });

        daysWritten += writtenRows.length;
      }
    }
  });

  return {
    activitiesScanned: activityRows.length,
    activitiesUsed,
    daysWritten,
    startDate,
    endDate,
  };
}

export async function getDailyTrainingStressSnapshot(
  database: FarSygilDatabase,
  limit = 14,
): Promise<DailyTrainingStressSnapshot> {
  const safeLimit = Math.max(0, Math.floor(limit));

  if (safeLimit === 0) {
    return {
      latest: null,
      series: [],
    };
  }

  const rows = await database
    .select({
      date: trainingLoad.date,
      dailyTrainingStress: trainingLoad.dailyTrainingStress,
    })
    .from(trainingLoad)
    .where(sql`${trainingLoad.dailyTrainingStress} is not null`)
    .orderBy(desc(trainingLoad.date))
    .limit(safeLimit);
  const series = rows
    .filter(
      (row): row is { date: string; dailyTrainingStress: number } =>
        typeof row.dailyTrainingStress === "number" &&
        Number.isFinite(row.dailyTrainingStress),
    )
    .reverse();

  return {
    latest: series.at(-1) ?? null,
    series,
  };
}

export function calculateActivityTrainingStress(
  activity: Pick<
    TrainingLoadActivityRow,
    "averageHeartrate" | "movingTimeSeconds" | "sufferScore"
  >,
): number | null {
  if (isPositiveNumber(activity.sufferScore)) {
    return roundStress(activity.sufferScore);
  }

  if (
    !isPositiveNumber(activity.averageHeartrate) ||
    !isPositiveNumber(activity.movingTimeSeconds)
  ) {
    return null;
  }

  const hours = activity.movingTimeSeconds / 3600;
  const effortRatio = activity.averageHeartrate / REFERENCE_HARD_EFFORT_HEART_RATE;
  const stress = hours * REFERENCE_HOURLY_STRESS * effortRatio;

  return stress > 0 ? roundStress(stress) : null;
}

function getLocalDateKey(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isPositiveNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function roundStress(value: number): number {
  return Math.round(value * 10) / 10;
}

function minDate(current: string | null, candidate: string): string {
  return current && current < candidate ? current : candidate;
}

function maxDate(current: string | null, candidate: string): string {
  return current && current > candidate ? current : candidate;
}
