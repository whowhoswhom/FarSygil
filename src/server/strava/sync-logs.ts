import { desc, eq } from "drizzle-orm";
import { dataImportLogs } from "@/db/schema";
import type { FarSygilDatabase } from "@/server/strava/oauth";

export interface StravaSyncLogEntry {
  id: number;
  source: string;
  eventType: string;
  message: string | null;
  activitiesAdded: number;
  activitiesUpdated: number;
  errorsCount: number;
  startedAt: string;
  completedAt: string | null;
}

export async function getRecentStravaSyncLogs(
  database: FarSygilDatabase,
  limit: number = 8,
): Promise<StravaSyncLogEntry[]> {
  const rows = await database
    .select({
      id: dataImportLogs.id,
      source: dataImportLogs.source,
      eventType: dataImportLogs.eventType,
      message: dataImportLogs.message,
      activitiesAdded: dataImportLogs.activitiesAdded,
      activitiesUpdated: dataImportLogs.activitiesUpdated,
      errorsCount: dataImportLogs.errorsCount,
      startedAt: dataImportLogs.startedAt,
      completedAt: dataImportLogs.completedAt,
    })
    .from(dataImportLogs)
    .where(eq(dataImportLogs.source, "strava"))
    .orderBy(desc(dataImportLogs.id))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    activitiesAdded: row.activitiesAdded ?? 0,
    activitiesUpdated: row.activitiesUpdated ?? 0,
    errorsCount: row.errorsCount ?? 0,
  }));
}
