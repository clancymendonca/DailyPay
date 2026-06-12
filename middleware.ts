import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRoute, isProtectedRoute } from "@/lib/middleware-routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("appwrite-session");
  const isAuthenticated = Boolean(session?.value);

  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.svg$|.*\\.png$).*)",
  ],
};
