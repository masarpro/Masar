import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionCookie = request.cookies.get("better-auth.session_token");

	// Logged-out user trying to access app routes
	if (pathname.startsWith("/app") && !sessionCookie) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	// Auth routes: always pass through.
	// The LoginForm handles redirecting logged-in users client-side,
	// which avoids redirect loops when session cookies are expired/stale.

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
