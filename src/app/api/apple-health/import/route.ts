import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/client";
import { APPLE_HEALTH_DEFAULT_RELATIVE_PATH } from "@/lib/apple-health/constants";
import {
  AppleHealthImportError,
  importAppleHealthExport,
} from "@/server/apple-health/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestedPath = await getRequestedPath(request);
  const pathResult = resolveImportPath(requestedPath);

  if (!pathResult.ok) {
    return NextResponse.json(
      {
        error: "invalid_path",
        message: pathResult.message,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const result = await importAppleHealthExport({
      database: db,
      filePath: pathResult.filePath,
      errorLogger: (message) => {
        console.error(message);
      },
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const importError =
      error instanceof AppleHealthImportError
        ? error
        : new AppleHealthImportError(
            error instanceof Error ? error.message : "Unknown import failure",
            "storage_failed",
            error,
          );

    return NextResponse.json(
      {
        error: importError.code,
        message: importError.message,
      },
      {
        status: getStatusCode(importError.code),
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

async function getRequestedPath(request: NextRequest): Promise<string | null> {
  const payload = (await request.json().catch(() => null)) as
    | { filePath?: unknown }
    | null;

  return typeof payload?.filePath === "string" ? payload.filePath : null;
}

function resolveImportPath(
  requestedPath: string | null,
):
  | {
      ok: true;
      filePath: string;
    }
  | {
      ok: false;
      message: string;
    } {
  const exportsDirectory = path.resolve(process.cwd(), "exports");
  const candidate = requestedPath?.trim()
    ? path.resolve(process.cwd(), requestedPath)
    : path.resolve(process.cwd(), APPLE_HEALTH_DEFAULT_RELATIVE_PATH);
  const relativeToExports = path.relative(exportsDirectory, candidate);
  const insideExports =
    relativeToExports === "" ||
    (!relativeToExports.startsWith("..") &&
      !path.isAbsolute(relativeToExports));

  if (!insideExports) {
    return {
      ok: false,
      message: "Apple Health imports must be read from the local exports directory.",
    };
  }

  return {
    ok: true,
    filePath: candidate,
  };
}

function getStatusCode(code: AppleHealthImportError["code"]): number {
  switch (code) {
    case "file_not_found":
      return 404;
    case "invalid_xml":
      return 400;
    case "storage_failed":
    default:
      return 500;
  }
}
