import { getOwnerContextByToken, getOwnerPayments } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

export const getOwnerPaymentsProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/payments",
		tags: ["Owner Portal"],
		summary: "Get project payments for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work to throttle brute-force and spam
		await rateLimitToken(input.token, "getOwnerPayments");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Get payments
		const payments = await getOwnerPayments(
			result.organizationId,
			result.projectId,
		);

		return {
			projectName: result.project.name,
			...payments,
		};
	});
