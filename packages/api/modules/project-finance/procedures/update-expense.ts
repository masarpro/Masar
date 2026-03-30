import { ORPCError } from "@orpc/server";
import { updateProjectExpense } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString, positiveAmount, MAX_NAME, MAX_DESC, MAX_URL } from "../../../lib/validation-constants";

export const updateExpense = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/expenses/{expenseId}",
		tags: ["Project Finance"],
		summary: "Update a project expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			expenseId: idString(),
			date: z.coerce.date().optional(),
			category: z
				.enum([
					"MATERIALS",
					"LABOR",
					"EQUIPMENT",
					"SUBCONTRACTOR",
					"TRANSPORT",
					"MISC",
				])
				.optional(),
			amount: positiveAmount().optional(),
			vendorName: z.string().trim().max(MAX_NAME).nullable().optional(),
			note: z.string().trim().max(MAX_DESC).nullable().optional(),
			attachmentUrl: z.string().trim().url().max(MAX_URL).nullable().optional(),
			subcontractContractId: z.string().trim().max(100).nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to manage payments
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			const expense = await updateProjectExpense(
				input.expenseId,
				input.organizationId,
				input.projectId,
				{
					date: input.date,
					category: input.category,
					amount: input.amount,
					vendorName: input.vendorName,
					note: input.note,
					attachmentUrl: input.attachmentUrl,
					subcontractContractId: input.subcontractContractId,
				},
			);

			return {
				...expense,
				amount: Number(expense.amount),
			};
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: "المصروف غير موجود",
			});
		}
	});
