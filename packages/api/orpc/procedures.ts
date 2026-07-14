import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/auth";

type ResolvedSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const baseProcedure = os.$context<{
	headers: Headers;
	/**
	 * Set ONLY by the in-process server client (SSR prefetch). Never derived
	 * from the HTTP request, so it cannot be spoofed by a client. Skips the
	 * per-call rate limiter — SSR prefetch is server-originated, not user
	 * abuse, and each Redis round-trip is pure latency on the render path.
	 */
	isInternal?: boolean;
	/**
	 * Request-deduped session passed by the in-process caller (React-cached in
	 * apps/web). Avoids re-running better-auth's cookie verification for every
	 * prefetched procedure in the same render.
	 */
	resolvedSession?: ResolvedSession;
}>();

// Outermost middleware on every procedure: turn business-rule errors thrown as
// a plain `Error` with a user-facing (Arabic) message into a proper
// `ORPCError("BAD_REQUEST")`, so the client sees the reason instead of an opaque
// 500. Already-typed ORPCErrors pass through untouched; English/internal errors
// (Prisma, network, bugs) are re-thrown as-is so they still reach Sentry as 500s.
export const publicProcedure = baseProcedure.use(async ({ next }) => {
	try {
		return await next();
	} catch (err) {
		if (err instanceof ORPCError) throw err;
		const message = err instanceof Error ? err.message : "";
		if (message && /[؀-ۿ]/.test(message)) {
			throw new ORPCError("BAD_REQUEST", { message });
		}
		throw err;
	}
});

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) => {
		const session =
			context.isInternal && context.resolvedSession !== undefined
				? context.resolvedSession
				: await auth.api.getSession({
						headers: context.headers,
					});

		if (!session) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// Block deactivated users — even with a valid session cookie, a user
		// whose isActive was set to false by an org admin must be rejected.
		// NOTE: better-auth's cookieCache (maxAge 5min, freshAge 60s) means this
		// flag can be up to 5 minutes stale; deactivation takes effect within
		// that window, not instantly.
		if (session.user.isActive === false) {
			const { logBusinessEvent } = await import("@repo/logs");
			logBusinessEvent({
				type: "auth.deactivated_access",
				userId: session.user.id,
				organizationId: session.session.activeOrganizationId ?? undefined,
				severity: "warning",
			});
			throw new ORPCError("UNAUTHORIZED", {
				message: "تم تعطيل حسابك. تواصل مع مدير المنظمة.",
			});
		}

		// Rate limit: READ preset (60/min per user). Skipped for in-process SSR
		// prefetch calls — they are server-originated (one Redis round-trip per
		// call would be pure latency on the render path, protecting nothing).
		if (!context.isInternal) {
			const { rateLimitChecker, RATE_LIMITS } = await import(
				"../lib/rate-limit"
			);
			await rateLimitChecker(session.user.id, "global", RATE_LIMITS.READ);
		}

		return await next({
			context: {
				session: session.session,
				user: session.user,
			},
		});
	},
);

export const adminProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.user.role !== "admin") {
			throw new ORPCError("FORBIDDEN");
		}

		return await next();
	},
);

export const subscriptionProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		const { checkSubscription } = await import(
			"./middleware/subscription-middleware"
		);
		await checkSubscription(context);

		// Rate limit: WRITE preset (20/min per user) — skipped for in-process
		// SSR calls (same reasoning as the READ limiter above).
		if (!context.isInternal) {
			const { rateLimitChecker, RATE_LIMITS } = await import(
				"../lib/rate-limit"
			);
			await rateLimitChecker(
				context.user.id,
				"global-write",
				RATE_LIMITS.WRITE,
			);
		}

		return await next();
	},
);
