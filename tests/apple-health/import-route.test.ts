import path from "node:path";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as importModule from "@/server/apple-health/import";

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/server/apple-health/import", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/apple-health/import")>(
      "@/server/apple-health/import",
    );

  return {
    ...actual,
    importAppleHealthExport: vi.fn(),
  };
});

describe("Apple Health import route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("imports the default local export path", async () => {
    const importAppleHealthExportMock = vi.mocked(
      importModule.importAppleHealthExport,
    );
    importAppleHealthExportMock.mockResolvedValue({
      fileName: "export.xml",
      recordsScanned: 11,
      recordsMatched: 9,
      metricsWritten: 7,
      startDate: "2026-05-14",
      endDate: "2026-05-15",
    });

    const { POST } = await import("../../src/app/api/apple-health/import/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/apple-health/import", {
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      fileName: "export.xml",
      metricsWritten: 7,
    });
    expect(importAppleHealthExportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: path.resolve(process.cwd(), "exports", "export.xml"),
      }),
    );
  });

  it("rejects paths outside the local exports directory", async () => {
    const importAppleHealthExportMock = vi.mocked(
      importModule.importAppleHealthExport,
    );

    const { POST } = await import("../../src/app/api/apple-health/import/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/apple-health/import", {
        method: "POST",
        body: JSON.stringify({ filePath: "../secret/export.xml" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "invalid_path",
      message:
        "Apple Health imports must be read from the local exports directory.",
    });
    expect(importAppleHealthExportMock).not.toHaveBeenCalled();
  });

  it("maps missing local export files to 404", async () => {
    const importAppleHealthExportMock = vi.mocked(
      importModule.importAppleHealthExport,
    );
    importAppleHealthExportMock.mockRejectedValue(
      new importModule.AppleHealthImportError(
        "Apple Health export file was not found at exports/export.xml",
        "file_not_found",
      ),
    );

    const { POST } = await import("../../src/app/api/apple-health/import/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/apple-health/import", {
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "file_not_found",
      message: "Apple Health export file was not found at exports/export.xml",
    });
  });
});
