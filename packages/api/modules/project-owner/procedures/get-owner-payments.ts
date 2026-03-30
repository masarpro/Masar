import { getOwnerPayments } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const getOwnerPaymentsProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/payments",
		tags: ["Owner Portal"],
		summary: "Get project payments for owner portal",
	})
	.input(
		z.object({
			token: z.string().trim().min(1).max(200).optional(),
			sessionToken: z.string().trim().min(1).max(200).optional(),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "getOwnerPayments");

		const result = await resolveOwnerContext(input);

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
