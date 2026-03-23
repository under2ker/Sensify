/**
 * Middleware для защиты маршрутов, требующих авторизации.
 * Дополняет проверки в отдельных route handlers — защита на случай забытой проверки.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_PROTECTED_API = [
  "/api/admin",
  "/api/grant-premium",
  "/api/revoke-premium",
  "/api/user/groq-key",
  "/api/user/gemini-key",
];

function isProtectedApi(pathname: string): boolean {
  return AUTH_PROTECTED_API.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if ((pathname === "/api/user/groq-key" || pathname === "/api/user/gemini-key") && request.method === "GET") {
    return NextResponse.next();
  }

  if (isProtectedApi(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/grant-premium",
    "/api/revoke-premium",
    "/api/user/groq-key",
    "/api/user/gemini-key",
  ],
};
