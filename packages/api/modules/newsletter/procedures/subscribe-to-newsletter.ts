import { ORPCError } from "@orpc/client";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { z } from "zod";
import { enforceRateLimit, createIpRateLimitKey, RATE_LIMITS } from "../../../lib/rate-limit";
import { verifyTurnstileToken } from "../../../lib/turnstile";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { publicProcedure } from "../../../orpc/procedures";

export const subscribeToNewsletter = publicProcedure
	.route({
		method: "POST",
		path: "/newsletter",
		tags: ["Newsletter"],
		summary: "Subscribe to newsletter",
	})
	.input(
		z.object({
			email: z.string().email(),
			turnstileToken: z.string().min(1),
		}),
	)
	.use(localeMiddleware)
	.handler(async ({ input, context: { locale, headers } }) => {
		const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		await enforceRateLimit(createIpRateLimitKey(ip, "subscribeToNewsletter"), RATE_LIMITS.PUBLIC_FORM);
		const { email, turnstileToken } = input;
		await verifyTurnstileToken(turnstileToken, ip);

		try {
			// ... add your crm or email service integration here to store the email of the user

			await sendEmail({
				to: email,
				locale,
				templateId: "newsletterSignup",
				context: {},
			});
		} catch (error) {
			logger.error(error);
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});
