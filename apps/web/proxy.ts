import { routing } from "@i18n/routing";
import { config as appConfig } from "@repo/config";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	const sessionCookie = getSessionCookie(req);

	if (pathname.startsWith("/app")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		// التحقق من mustChangePassword عبر session API
		try {
			const sessionRes = await fetch(
				new URL("/api/auth/get-session", origin),
				{
					headers: {
						cookie: req.headers.get("cookie") || "",
					},
				},
			);

			if (sessionRes.ok) {
				const session = await sessionRes.json();
				if (session?.user?.mustChangePassword) {
					return NextResponse.redirect(
						new URL("/auth/change-password", origin),
					);
				}
			}
		} catch {
			// لا نوقف الطلب في حال فشل الاتصال
		}

		return NextResponse.next();
	}

	if (pathname.startsWith("/auth")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		return NextResponse.next();
	}

	const pathsWithoutLocale = [
		"/onboarding",
		"/new-organization",
		"/choose-plan",
		"/organization-invitation",
	];

	if (pathsWithoutLocale.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	if (!appConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt).*)",
	],
};
