import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/auth";

export const publicProcedure = os.$context<{
	headers: Headers;
}>();

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) => {
		const session = await auth.api.getSession({
			headers: context.headers,
		});

		if (!session) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// Block deactivated users immediately — even with a valid session cookie,
		// a user whose isActive was set to false by an org admin must be rejected.
		// BetterAuth includes isActive via additionalFields and freshAge:0 ensures
		// the value is always re-read from the DB on every request.
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

		// Rate limit: READ preset (60/min per user)
		const { rateLimitChecker, RATE_LIMITS } = await import(
			"../lib/rate-limit"
		);
		await rateLimitChecker(session.user.id, "global", RATE_LIMITS.READ);

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

		// Rate limit: WRITE preset (20/min per user)
		const { rateLimitChecker, RATE_LIMITS } = await import(
			"../lib/rate-limit"
		);
		await rateLimitChecker(context.user.id, "global-write", RATE_LIMITS.WRITE);

		return await next();
	},
);
