import path from "node:path";
import { realpath } from "node:fs/promises";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/client";
import {
  APPLE_HEALTH_DEFAULT_RELATIVE_PATH,
  APPLE_HEALTH_IMPORT_ROOTS,
} from "@/lib/apple-health/constants";
import {
  AppleHealthImportError,
  importAppleHealthExport,
} from "@/server/apple-health/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let importInProgress = false;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestedPath = await getRequestedPath(request);
  const pathResult = await resolveImportPath(requestedPath);

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

  if (importInProgress) {
    return NextResponse.json(
      {
        error: "import_in_progress",
        message: "An Apple Health import is already running locally.",
      },
      {
        status: 409,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  importInProgress = true;

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
  } finally {
    importInProgress = false;
  }
}

async function getRequestedPath(request: NextRequest): Promise<string | null> {
  const payload = (await request.json().catch(() => null)) as
    | { filePath?: unknown }
    | null;

  return typeof payload?.filePath === "string" ? payload.filePath : null;
}

async function resolveImportPath(
  requestedPath: string | null,
): Promise<
  | {
      ok: true;
      filePath: string;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const candidate = requestedPath?.trim()
    ? path.resolve(process.cwd(), requestedPath)
    : path.resolve(process.cwd(), APPLE_HEALTH_DEFAULT_RELATIVE_PATH);
  const allowedRoots = APPLE_HEALTH_IMPORT_ROOTS.map((root) =>
    path.resolve(process.cwd(), root),
  );

  if (!allowedRoots.some((root) => isInsideDirectory(candidate, root))) {
    return {
      ok: false,
      message:
        "Apple Health imports must be read from a local Apple Health export directory.",
    };
  }

  const [candidateRealPath, ...allowedRealRoots] = await Promise.all([
    realpath(candidate).catch(() => null),
    ...allowedRoots.map((root) => realpath(root).catch(() => null)),
  ]);

  if (candidateRealPath) {
    const realInsideAllowedRoot = allowedRealRoots.some(
      (root) => root && isInsideDirectory(candidateRealPath, root),
    );

    if (!realInsideAllowedRoot) {
      return {
        ok: false,
        message:
          "Apple Health imports must resolve inside a local Apple Health export directory.",
      };
    }
  }

  return {
    ok: true,
    filePath: candidate,
  };
}

function isInsideDirectory(candidate: string, directory: string): boolean {
  const relativePath = path.relative(directory, candidate);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function getStatusCode(code: AppleHealthImportError["code"]): number {
  switch (code) {
    case "file_not_found":
      return 404;
    case "invalid_zip":
    case "invalid_xml":
      return 400;
    case "storage_failed":
    default:
      return 500;
  }
}
