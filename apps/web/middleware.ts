import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionCookie = request.cookies.get("better-auth.session_token");

	// Logged-out user trying to access app routes
	if (pathname.startsWith("/app") && !sessionCookie) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	// Logged-in user trying to access auth routes
	if (pathname.startsWith("/auth/") && sessionCookie) {
		return NextResponse.redirect(new URL("/app", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
