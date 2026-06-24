import { updateContractPaymentTerm } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updatePaymentTerm = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/projects/{projectId}/contract/payment-terms/{termId}",
		tags: ["Project Contract"],
		summary: "Update a single contract payment term",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			termId: z.string().trim().max(100),
			type: z.enum([
				"ADVANCE",
				"MILESTONE",
				"MONTHLY",
				"COMPLETION",
				"CUSTOM",
			]),
			label: z.string().trim().max(100).nullish(),
			percent: z.number().min(0).max(100).nullish(),
			amount: z.number().min(0).nullish(),
			dueDate: z.coerce.date().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			const term = await updateContractPaymentTerm(
				input.organizationId,
				input.projectId,
				input.termId,
				{
					type: input.type,
					label: input.label,
					percent: input.percent,
					amount: input.amount,
					dueDate: input.dueDate,
				},
			);

			return {
				id: term.id,
				type: term.type,
				label: term.label,
				percent: term.percent,
				amount: term.amount,
				status: term.status,
			};
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			if (error instanceof Error && error.message === "TERM_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", {
					message: "مرحلة الدفع غير موجودة",
				});
			}
			throw error;
		}
	});
