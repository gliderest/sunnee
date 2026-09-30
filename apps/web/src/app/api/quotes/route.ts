import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchOsrmRoute } from "@/lib/geo";
import { generateQuotes, nextTick } from "@/lib/mock/engine";
import type { QuoteResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const bodySchema = z.object({
  pickup: pointSchema,
  destination: pointSchema,
  /** client tự tăng mỗi lần refresh để mock engine đổi giá */
  tick: z.number().int().min(0).optional(),
});

/**
 * GET /api/quotes?pickup=lat,lng&destination=lat,lng&tick=3
 * Phase 2: thay `generateQuotes` bằng truy vấn `ride_quotes` trên Supabase.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = bodySchema.safeParse({
    pickup: parsePoint(url.searchParams.get("pickup")),
    destination: parsePoint(url.searchParams.get("destination")),
    tick: url.searchParams.has("tick") ? Number(url.searchParams.get("tick")) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Tham số không hợp lệ", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { pickup, destination, tick } = parsed.data;
  const effectiveTick = tick ?? nextTick();

  const [route, quotes] = await Promise.all([
    fetchOsrmRoute(pickup, destination),
    Promise.resolve(generateQuotes(pickup, destination, effectiveTick)),
  ]);

  const result: QuoteResult = {
    quotes,
    route: {
      coordinates: route.coordinates,
      distance_km: route.distance_km,
      duration_minutes: route.duration_minutes,
      source: route.source,
    },
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store, max-age=0" },
  });
}

function parsePoint(raw: string | null): { lat: number; lng: number } | null {
  if (!raw) return null;
  const [lat, lng] = raw.split(",").map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}