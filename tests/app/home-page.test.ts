import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as oauthModule from "@/server/strava/oauth";

const redirectMock = vi.fn((destination: string) => {
  throw new Error(`NEXT_REDIRECT:${destination}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => createElement("a", { href, ...props }, children),
}));

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/components/app-shell", () => ({
  AppIcon: ({ name }: { name: string }) =>
    createElement("span", { "data-icon": name }),
  AppLogoMark: (props: Record<string, unknown>) => createElement("svg", props),
}));

vi.mock("@/server/strava/oauth", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/oauth")>(
      "@/server/strava/oauth",
    );

  return {
    ...actual,
    getStravaConnectionStatus: vi.fn(),
  };
});

describe("home page", () => {
  beforeAll(async () => {
    vi.stubGlobal("React", await import("react"));
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("redirects connected users to the dashboard", async () => {
    const getStravaConnectionStatusMock = vi.mocked(
      oauthModule.getStravaConnectionStatus,
    );
    getStravaConnectionStatusMock.mockResolvedValue({
      connected: true,
      athleteId: 42,
      scope: "read,activity:read_all",
      expiresAt: 2_080_000_000,
      expired: false,
      updatedAt: "2026-05-13T10:00:00Z",
    });

    const { default: HomePage } = await import("../../src/app/page");

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the disconnected onboarding surface when no Strava connection exists", async () => {
    const getStravaConnectionStatusMock = vi.mocked(
      oauthModule.getStravaConnectionStatus,
    );
    getStravaConnectionStatusMock.mockResolvedValue({
      connected: false,
      athleteId: null,
      scope: null,
      expiresAt: null,
      expired: false,
      updatedAt: null,
    });

    const { default: HomePage } = await import("../../src/app/page");
    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(html).toContain("FarSygil");
    expect(html).toContain("Local-first running command center");
    expect(html).toContain("Connect Strava");
    expect(html).toContain("Open Connect");
    expect(html).toContain("No map tiles, no geocoding, no telemetry.");
  });
});
