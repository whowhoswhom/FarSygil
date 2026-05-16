import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";
import { SaxesParser, type SaxesTagPlain } from "saxes";

import {
  dataImportLogs,
  healthMetrics,
  healthRawImports,
} from "@/db/schema";
import { APPLE_HEALTH_DEFAULT_RELATIVE_PATH } from "@/lib/apple-health/constants";
import type { FarSygilDatabase } from "@/server/strava/oauth";

export const APPLE_HEALTH_SOURCE = "AppleHealth";

type AggregateMode = "average" | "sum";

interface QuantityMetricDefinition {
  metricType: string;
  aggregate: AggregateMode;
  unit: string | null;
}

interface MetricAccumulator {
  date: string;
  metricType: string;
  aggregate: AggregateMode;
  unit: string | null;
  sum: number;
  count: number;
}

export interface AppleHealthImportResult {
  fileName: string;
  recordsScanned: number;
  recordsMatched: number;
  metricsWritten: number;
  startDate: string | null;
  endDate: string | null;
}

export type AppleHealthImportErrorCode =
  | "file_not_found"
  | "invalid_xml"
  | "storage_failed";

export class AppleHealthImportError extends Error {
  constructor(
    message: string,
    public readonly code: AppleHealthImportErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppleHealthImportError";
  }
}

const QUANTITY_METRIC_DEFINITIONS: Record<string, QuantityMetricDefinition> = {
  HKQuantityTypeIdentifierRestingHeartRate: {
    metricType: "resting_hr",
    aggregate: "average",
    unit: "bpm",
  },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: {
    metricType: "hrv",
    aggregate: "average",
    unit: "ms",
  },
  HKQuantityTypeIdentifierStepCount: {
    metricType: "steps",
    aggregate: "sum",
    unit: "count",
  },
  HKQuantityTypeIdentifierBodyMass: {
    metricType: "body_mass",
    aggregate: "average",
    unit: null,
  },
  HKQuantityTypeIdentifierVO2Max: {
    metricType: "vo2_max",
    aggregate: "average",
    unit: "mL/kg/min",
  },
  HKQuantityTypeIdentifierActiveEnergyBurned: {
    metricType: "active_energy",
    aggregate: "sum",
    unit: "kcal",
  },
};

const SLEEP_ANALYSIS_TYPE = "HKCategoryTypeIdentifierSleepAnalysis";

export async function importAppleHealthExport(options: {
  database: FarSygilDatabase;
  filePath?: string;
  errorLogger?: (message: string) => void;
}): Promise<AppleHealthImportResult> {
  const {
    database,
    filePath = path.resolve(process.cwd(), APPLE_HEALTH_DEFAULT_RELATIVE_PATH),
    errorLogger,
  } = options;
  const resolvedPath = path.resolve(filePath);
  const fileName = path.basename(resolvedPath);

  try {
    await assertReadableFile(resolvedPath);
  } catch (error) {
    const importError =
      error instanceof AppleHealthImportError
        ? error
        : new AppleHealthImportError(
            `Apple Health export file was not found at ${resolvedPath}`,
            "file_not_found",
            error,
          );
    await writeImportErrorLog(database, importError, errorLogger);
    throw importError;
  }

  const result: AppleHealthImportResult = {
    fileName,
    recordsScanned: 0,
    recordsMatched: 0,
    metricsWritten: 0,
    startDate: null,
    endDate: null,
  };

  try {
    await insertImportLog(database, {
      eventType: "sync_start",
      message: `Apple Health import started for ${fileName}.`,
    });

    const parsedExport = await parseAppleHealthExport(resolvedPath);
    const metricRows = parsedExport.metrics.map((metric) => ({
      date: metric.date,
      metricType: metric.metricType,
      value: metric.value,
      unit: metric.unit,
      source: APPLE_HEALTH_SOURCE,
    }));

    result.recordsScanned = parsedExport.recordsScanned;
    result.recordsMatched = parsedExport.recordsMatched;
    result.startDate = parsedExport.startDate;
    result.endDate = parsedExport.endDate;

    await database.transaction(async (transaction) => {
      if (metricRows.length > 0) {
        const writtenMetricRows = await transaction
          .insert(healthMetrics)
          .values(metricRows)
          .onConflictDoUpdate({
            target: [healthMetrics.date, healthMetrics.metricType],
            set: {
              value: sql`excluded.value`,
              unit: sql`excluded.unit`,
            },
            setWhere: sql`${healthMetrics.source} = ${APPLE_HEALTH_SOURCE}`,
          })
          .returning({
            id: healthMetrics.id,
          });

        result.metricsWritten = writtenMetricRows.length;
      }

      await transaction.insert(healthRawImports).values({
        filename: fileName,
        recordCount: result.metricsWritten,
        notes: buildRawImportNote(result),
      });

      await transaction.insert(dataImportLogs).values({
        source: "apple_health",
        eventType: "sync_complete",
        message: `Apple Health import completed with ${result.metricsWritten} daily metric rows.`,
        completedAt: sql`(datetime('now'))`,
      });
    });

    return result;
  } catch (error) {
    const importError = toAppleHealthImportError(error);
    errorLogger?.(`[apple-health-import] ${importError.message}`);
    await writeImportErrorLog(database, importError, errorLogger);
    throw importError;
  }
}

async function parseAppleHealthExport(filePath: string): Promise<{
  recordsScanned: number;
  recordsMatched: number;
  startDate: string | null;
  endDate: string | null;
  metrics: Array<{
    date: string;
    metricType: string;
    value: number;
    unit: string | null;
  }>;
}> {
  const accumulators = new Map<string, MetricAccumulator>();
  const parser = new SaxesParser({ xmlns: false });
  let recordsScanned = 0;
  let recordsMatched = 0;
  let startDate: string | null = null;
  let endDate: string | null = null;

  parser.on("opentag", (tag: SaxesTagPlain) => {
    if (tag.name !== "Record") {
      return;
    }

    recordsScanned += 1;
    const metric = readMetricContribution(tag.attributes);

    if (!metric) {
      return;
    }

    recordsMatched += 1;
    startDate = minDate(startDate, metric.date);
    endDate = maxDate(endDate, metric.date);
    addMetricContribution(accumulators, metric);
  });

  await new Promise<void>((resolve, reject) => {
    const readStream = createReadStream(filePath, { encoding: "utf8" });
    let settled = false;

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      readStream.destroy();
      reject(error);
    };

    parser.on("error", rejectOnce);
    readStream.on("error", rejectOnce);
    readStream.on("data", (chunk) => {
      try {
        parser.write(chunk);
      } catch (error) {
        rejectOnce(error);
      }
    });
    readStream.on("end", () => {
      if (settled) {
        return;
      }

      try {
        parser.close();
        settled = true;
        resolve();
      } catch (error) {
        rejectOnce(error);
      }
    });
  }).catch((error) => {
    throw new AppleHealthImportError(
      "Apple Health export XML could not be parsed",
      "invalid_xml",
      error,
    );
  });

  const metrics = [...accumulators.values()]
    .map((accumulator) => ({
      date: accumulator.date,
      metricType: accumulator.metricType,
      value:
        accumulator.aggregate === "average"
          ? accumulator.sum / accumulator.count
          : accumulator.sum,
      unit: accumulator.unit,
    }))
    .sort((left, right) =>
      left.date === right.date
        ? left.metricType.localeCompare(right.metricType)
        : left.date.localeCompare(right.date),
    );

  return {
    recordsScanned,
    recordsMatched,
    startDate,
    endDate,
    metrics,
  };
}

function readMetricContribution(attributes: Record<string, string>):
  | {
      date: string;
      metricType: string;
      value: number;
      unit: string | null;
      aggregate: AggregateMode;
    }
  | null {
  const recordType = attributes.type;
  const startDate = attributes.startDate;
  const endDate = attributes.endDate;
  const date = readAppleHealthDate(startDate ?? endDate);

  if (!recordType || !date) {
    return null;
  }

  if (recordType === SLEEP_ANALYSIS_TYPE) {
    if (!isAsleepValue(attributes.value)) {
      return null;
    }

    const durationHours = readDurationHours(startDate, endDate);

    if (durationHours === null || durationHours <= 0) {
      return null;
    }

    return {
      date,
      metricType: "sleep_hours",
      value: durationHours,
      unit: "hr",
      aggregate: "sum",
    };
  }

  const definition = QUANTITY_METRIC_DEFINITIONS[recordType];

  if (!definition) {
    return null;
  }

  const value = readFiniteNumber(attributes.value);

  if (value === null) {
    return null;
  }

  return {
    date,
    metricType: definition.metricType,
    value,
    unit: definition.unit ?? normalizeUnit(attributes.unit),
    aggregate: definition.aggregate,
  };
}

function addMetricContribution(
  accumulators: Map<string, MetricAccumulator>,
  contribution: {
    date: string;
    metricType: string;
    value: number;
    unit: string | null;
    aggregate: AggregateMode;
  },
): void {
  const key = `${contribution.date}\u0000${contribution.metricType}`;
  const existing = accumulators.get(key);

  if (existing) {
    existing.sum += contribution.value;
    existing.count += 1;
    return;
  }

  accumulators.set(key, {
    date: contribution.date,
    metricType: contribution.metricType,
    aggregate: contribution.aggregate,
    unit: contribution.unit,
    sum: contribution.value,
    count: 1,
  });
}

async function assertReadableFile(filePath: string): Promise<void> {
  const fileStats = await stat(filePath).catch((error) => {
    throw new AppleHealthImportError(
      `Apple Health export file was not found at ${filePath}`,
      "file_not_found",
      error,
    );
  });

  if (!fileStats.isFile()) {
    throw new AppleHealthImportError(
      `Apple Health export path is not a file: ${filePath}`,
      "file_not_found",
    );
  }
}

async function insertImportLog(
  database: FarSygilDatabase,
  options: {
    eventType: "sync_start" | "sync_complete" | "sync_error";
    message: string;
    errorsCount?: number;
    completedAtNow?: boolean;
  },
): Promise<void> {
  await database.insert(dataImportLogs).values({
    source: "apple_health",
    eventType: options.eventType,
    message: options.message,
    errorsCount: options.errorsCount ?? 0,
    completedAt: options.completedAtNow ? sql`(datetime('now'))` : null,
  });
}

async function writeImportErrorLog(
  database: FarSygilDatabase,
  error: AppleHealthImportError,
  errorLogger?: (message: string) => void,
): Promise<void> {
  try {
    await insertImportLog(database, {
      eventType: "sync_error",
      message: error.message,
      errorsCount: 1,
      completedAtNow: true,
    });
  } catch (logError) {
    errorLogger?.(
      `[apple-health-import] failed to write import error log: ${getErrorMessage(logError)}`,
    );
  }
}

function toAppleHealthImportError(error: unknown): AppleHealthImportError {
  if (error instanceof AppleHealthImportError) {
    return error;
  }

  return new AppleHealthImportError(
    getErrorMessage(error),
    "storage_failed",
    error,
  );
}

function buildRawImportNote(result: AppleHealthImportResult): string {
  const range =
    result.startDate && result.endDate
      ? `${result.startDate} to ${result.endDate}`
      : "no matched dates";

  return `${result.recordsScanned} records scanned, ${result.recordsMatched} matched, ${result.metricsWritten} daily metric rows written, range ${range}.`;
}

function normalizeUnit(unit: string | undefined): string | null {
  const trimmed = unit?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function readFiniteNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readAppleHealthDate(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return null;
  }

  return value.slice(0, 10);
}

function readDurationHours(
  startDate: string | undefined,
  endDate: string | undefined,
): number | null {
  const start = parseAppleHealthTimestamp(startDate);
  const end = parseAppleHealthTimestamp(endDate);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return (end - start) / 3_600_000;
}

function parseAppleHealthTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/,
  );
  const normalized = match
    ? `${match[1]}T${match[2]}${match[3]}:${match[4]}`
    : value;
  const timestamp = Date.parse(normalized);

  return Number.isFinite(timestamp) ? timestamp : null;
}

function isAsleepValue(value: string | undefined): boolean {
  return value?.toLowerCase().includes("asleep") ?? false;
}

function minDate(current: string | null, candidate: string): string {
  return current && current < candidate ? current : candidate;
}

function maxDate(current: string | null, candidate: string): string {
  return current && current > candidate ? current : candidate;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
