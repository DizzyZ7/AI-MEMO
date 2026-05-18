import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/trpc/ai")) {
    res.headers.set("x-ai-memo-limit-scope", "monthly-ai-processing");
  }

  return res;
}

export const config = {
  matcher: ["/api/trpc/:path*"],
};
