import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((destination: string) => {
  throw new Error(`NEXT_REDIRECT:${destination}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("activities compatibility redirects", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("redirects /activities query params to /runs", async () => {
    const { default: ActivitiesRedirectPage } = await import(
      "../../src/app/activities/page"
    );

    await expect(
      ActivitiesRedirectPage({
        searchParams: Promise.resolve({
          sport: "Run",
          tag: ["tempo", "long"],
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/runs?sport=Run&tag=tempo&tag=long",
    );

    expect(redirectMock).toHaveBeenCalledWith(
      "/runs?sport=Run&tag=tempo&tag=long",
    );
  });

  it("redirects /activities/[id] query params to /runs/[id]", async () => {
    const { default: ActivityDetailRedirectPage } = await import(
      "../../src/app/activities/[id]/page"
    );

    await expect(
      ActivityDetailRedirectPage({
        params: Promise.resolve({ id: "9001" }),
        searchParams: Promise.resolve({
          splitUnit: "km",
          view: ["hr", "pace"],
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/runs/9001?splitUnit=km&view=hr&view=pace",
    );

    expect(redirectMock).toHaveBeenCalledWith(
      "/runs/9001?splitUnit=km&view=hr&view=pace",
    );
  });
});
