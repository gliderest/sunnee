import { NextResponse } from "next/server";
import { z } from "zod";

import { SAMPLE_PLACES } from "@/lib/constants";
import type { Place } from "@/lib/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({ q: z.string().min(1).max(120) });

/**
 * GET /api/places?q=times
 * MVP: lọc trong tập địa điểm mẫu của Hà Nội.
 * Phase 2: thay bằng Nominatim / Google Places (giữ nguyên shape `{ id, name, address, lat, lng }`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ error: "Thiếu từ khoá tìm kiếm" }, { status: 400 });
  }

  const q = removeDiacritics(parsed.data.q).toLowerCase();
  const results: Place[] = SAMPLE_PLACES.filter((p) => {
    const haystack = removeDiacritics(`${p.name} ${p.address}`).toLowerCase();
    return haystack.includes(q);
  }).map((p) => ({ ...p }));

  return NextResponse.json({ results }, { headers: { "cache-control": "no-store" } });
}

function removeDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}