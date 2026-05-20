import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { recomputeDailyTrainingStress } from "@/server/training-load/daily-stress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const result = await recomputeDailyTrainingStress(db);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[training-load] daily stress recompute failed:", error);

    return NextResponse.json(
      {
        error: "training_load_recompute_failed",
        message: "Training load daily stress could not be recomputed locally.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
