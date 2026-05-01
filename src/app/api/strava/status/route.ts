import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return NextResponse.json(await getStravaConnectionStatus(db));
}
