import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/server/training-load/daily-stress", () => ({
  recomputeDailyTrainingStress: vi.fn(),
}));

describe("training load recompute route", () => {
  it("returns recompute results with no-store headers", async () => {
    const { recomputeDailyTrainingStress } = await import(
      "../../src/server/training-load/daily-stress"
    );
    vi.mocked(recomputeDailyTrainingStress).mockResolvedValue({
      activitiesScanned: 3,
      activitiesUsed: 2,
      daysWritten: 1,
      startDate: "2026-05-11",
      endDate: "2026-05-11",
    });

    const { POST } = await import(
      "../../src/app/api/training-load/recompute/route"
    );
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      activitiesScanned: 3,
      activitiesUsed: 2,
      daysWritten: 1,
      startDate: "2026-05-11",
      endDate: "2026-05-11",
    });
  });

  it("returns a no-store local error when recompute fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { recomputeDailyTrainingStress } = await import(
      "../../src/server/training-load/daily-stress"
    );

    try {
      vi.mocked(recomputeDailyTrainingStress).mockRejectedValue(
        new Error("database failed"),
      );

      const { POST } = await import(
        "../../src/app/api/training-load/recompute/route"
      );
      const response = await POST();
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(payload).toEqual({
        error: "training_load_recompute_failed",
        message: "Training load daily stress could not be recomputed locally.",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
