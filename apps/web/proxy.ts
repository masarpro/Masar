import { routing } from "@i18n/routing";
import { config as appConfig } from "@repo/config";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";

const intlMiddleware = createMiddleware(routing);

const AUTH_REQUIRED_PATHS = [
	"/onboarding",
	"/new-organization",
	"/choose-plan",
	"/organization-invitation",
];

export default function proxy(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	// 0. Maintenance mode (DB migration cutover). Enabled by setting
	// MAINTENANCE_MODE=1 in Vercel env + redeploy. Blocks the app + token
	// portals with a static page; marketing stays live. The hard write-freeze
	// during cutover is rotating the old DB password (see migration runbook) —
	// this page is the user-facing half.
	if (process.env.MAINTENANCE_MODE === "1") {
		if (pathname === "/maintenance") {
			return NextResponse.next();
		}
		if (
			pathname.startsWith("/app") ||
			pathname.startsWith("/owner") ||
			pathname.startsWith("/share") ||
			pathname.startsWith("/auth") ||
			AUTH_REQUIRED_PATHS.some((path) => pathname.startsWith(path))
		) {
			return NextResponse.rewrite(new URL("/maintenance", origin));
		}
	}

	// 1. Public token routes — always pass through
	if (pathname.startsWith("/owner") || pathname.startsWith("/share")) {
		return NextResponse.next();
	}

	// 2. /app/* — SaaS core (auth required)
	if (pathname.startsWith("/app")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		const sessionCookie = getSessionCookie(req);
		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", { redirectTo: pathname }),
					origin,
				),
			);
		}

		return NextResponse.next();
	}

	// 3. /auth/* — pass through (SaaS must be enabled)
	if (pathname.startsWith("/auth")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		return NextResponse.next();
	}

	// 3b. /invitation/* — accept-invitation page (locale from cookie, no locale prefix)
	if (pathname.startsWith("/invitation")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		return NextResponse.next();
	}

	// 4. Pre-login SaaS paths (auth required)
	if (AUTH_REQUIRED_PATHS.some((path) => pathname.startsWith(path))) {
		const sessionCookie = getSessionCookie(req);
		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", { redirectTo: pathname }),
					origin,
				),
			);
		}

		return NextResponse.next();
	}

	// 5. Marketing / locale routes — fallthrough
	if (!appConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon\\.ico|icon\\.png|sitemap\\.xml|robots\\.txt).*)",
	],
};
