import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, getOwnerPayments } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

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
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Get payments
		const payments = await getOwnerPayments(
			context.organizationId,
			context.projectId,
		);

		return {
			projectName: context.project.name,
			...payments,
		};
	});
