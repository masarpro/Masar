import { ORPCError } from "@orpc/client";
import { config } from "@repo/config";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { enforceRateLimit, createIpRateLimitKey, RATE_LIMITS } from "../../../lib/rate-limit";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { publicProcedure } from "../../../orpc/procedures";
import { contactFormSchema } from "../types";

export const submitContactForm = publicProcedure
	.route({
		method: "POST",
		path: "/contact",
		tags: ["Contact"],
		summary: "Submit contact form",
	})
	.input(contactFormSchema)
	.use(localeMiddleware)
	.handler(
		async ({ input: { email, name, message }, context: { locale, headers } }) => {
			const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
			await enforceRateLimit(createIpRateLimitKey(ip, "submitContactForm"), RATE_LIMITS.STRICT);
			try {
				await sendEmail({
					to: config.contactForm.to,
					locale,
					subject: config.contactForm.subject,
					text: `Name: ${name}\n\nEmail: ${email}\n\nMessage: ${message}`,
				});
			} catch (error) {
				logger.error(error);
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}
		},
	);
