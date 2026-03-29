import {
	getOwnerContextByToken,
	createOwnerPortalSession,
} from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken, enforceRateLimit, createIpRateLimitKey, RATE_LIMITS } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

export const exchangeTokenProcedure = publicProcedure
	.route({
		method: "POST",
		path: "/owner-portal/exchange-token",
		tags: ["Owner Portal"],
		summary: "Exchange a URL token for a session token",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
		}),
	)
	.handler(async ({ input, context }) => {
		// IP-based rate limit (5/min) — prevents brute-force across different tokens
		const ip = context.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		await enforceRateLimit(createIpRateLimitKey(ip, "exchangeToken"), RATE_LIMITS.OWNER_EXCHANGE);

		// Per-token rate limit (30/min) — defense in depth
		await rateLimitToken(input.token, "exchangeToken");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			// Delay failed attempts to slow brute-force
			await new Promise((resolve) => setTimeout(resolve, 1000));
			throwOwnerTokenError(result.reason);
		}

		// Create session
		const ipAddress = ip !== "unknown" ? ip : undefined;
		const userAgent = context.headers.get("user-agent") ?? undefined;

		const session = await createOwnerPortalSession(result.accessId, {
			ipAddress,
			userAgent,
		});

		return {
			sessionToken: session.sessionToken,
			expiresAt: session.expiresAt.toISOString(),
		};
	});
