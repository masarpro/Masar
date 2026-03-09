import {
	getOwnerContextByToken,
	createOwnerPortalSession,
} from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
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
		// Rate limit to prevent brute-force
		await rateLimitToken(input.token, "exchangeToken");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Create session
		const ipAddress =
			context.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
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
