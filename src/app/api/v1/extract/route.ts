/**
 * REST API для экстракции знаний.
 * POST /api/v1/extract — тот же формат тела, что и /api/extract.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const body = await request.text();
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${origin}/api/extract`, {
    method: "POST",
    headers,
    body: body || undefined,
  });

  const data = await res.json().catch(() => ({}));
  const retryAfter = res.status === 429 ? res.headers.get("retry-after") : null;
  return NextResponse.json(data, {
    status: res.status,
    headers: retryAfter ? { "Retry-After": retryAfter } : undefined,
  });
}
