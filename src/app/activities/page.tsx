import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { activities as activitiesTable } from "@/db/schema";
import { ActivitiesStream } from "@/app/activities/activities-stream";
import { buildNormalizedRoutePath } from "@/lib/activities/polyline";
import type { ArchiveActivity } from "@/lib/activities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const rows = await db
    .select({
      id: activitiesTable.id,
      stravaId: activitiesTable.stravaId,
      name: activitiesTable.name,
      sportType: activitiesTable.sportType,
      startDate: activitiesTable.startDate,
      startDateLocal: activitiesTable.startDateLocal,
      timezone: activitiesTable.timezone,
      distanceMeters: activitiesTable.distanceMeters,
      movingTimeSeconds: activitiesTable.movingTimeSeconds,
      elapsedTimeSeconds: activitiesTable.elapsedTimeSeconds,
      totalElevationGain: activitiesTable.totalElevationGain,
      averageSpeed: activitiesTable.averageSpeed,
      maxSpeed: activitiesTable.maxSpeed,
      averageHeartrate: activitiesTable.averageHeartrate,
      maxHeartrate: activitiesTable.maxHeartrate,
      averageCadence: activitiesTable.averageCadence,
      averageWatts: activitiesTable.averageWatts,
      sufferScore: activitiesTable.sufferScore,
      perceivedExertion: activitiesTable.perceivedExertion,
      startLatitude: activitiesTable.startLatitude,
      startLongitude: activitiesTable.startLongitude,
      mapPolyline: activitiesTable.mapPolyline,
      source: activitiesTable.source,
    })
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.startDate));

  const activities: ArchiveActivity[] = rows.map((row) => ({
    ...row,
    source: row.source ?? "strava",
    routePathData: buildNormalizedRoutePath(row.mapPolyline),
  }));

  return <ActivitiesStream activities={activities} />;
}
