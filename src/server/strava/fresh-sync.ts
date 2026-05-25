import { recomputeDailyTrainingStress } from "@/server/training-load/daily-stress";
import { syncStravaActivityDetails } from "@/server/strava/detail-sync";
import type {
  FarSygilDatabase,
  StravaOAuthConfig,
} from "@/server/strava/oauth";
import { syncStravaActivities } from "@/server/strava/sync";

type FetchImplementation = typeof fetch;

export interface StravaFreshSyncResult {
  summary: Awaited<ReturnType<typeof syncStravaActivities>>;
  details: Awaited<ReturnType<typeof syncStravaActivityDetails>> | null;
  detailError: string | null;
  dailyStress: Awaited<ReturnType<typeof recomputeDailyTrainingStress>> | null;
  dailyStressError: string | null;
}

export async function syncStravaFreshData(options: {
  database: FarSygilDatabase;
  config: StravaOAuthConfig;
  fetchImplementation?: FetchImplementation;
  nowUnix?: number;
  errorLogger?: (message: string) => void;
}): Promise<StravaFreshSyncResult> {
  const {
    database,
    config,
    fetchImplementation = fetch,
    nowUnix,
    errorLogger,
  } = options;
  const summary = await syncStravaActivities({
    database,
    config,
    fetchImplementation,
    nowUnix,
    errorLogger,
  });
  let details: Awaited<ReturnType<typeof syncStravaActivityDetails>> | null =
    null;
  let detailError: string | null = null;
  let dailyStress: Awaited<ReturnType<typeof recomputeDailyTrainingStress>> | null =
    null;
  let dailyStressError: string | null = null;

  try {
    details = await syncStravaActivityDetails({
      database,
      config,
      mode: "incremental",
      fetchImplementation,
      nowUnix,
      errorLogger,
    });
  } catch (error) {
    detailError = getErrorMessage(error);
    errorLogger?.(`[strava-fresh-sync] detail backfill deferred: ${detailError}`);
  }

  try {
    dailyStress = await recomputeDailyTrainingStress(database);
  } catch (error) {
    dailyStressError = getErrorMessage(error);
    errorLogger?.(
      `[strava-fresh-sync] daily stress recompute deferred: ${dailyStressError}`,
    );
  }

  return {
    summary,
    details,
    detailError,
    dailyStress,
    dailyStressError,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
