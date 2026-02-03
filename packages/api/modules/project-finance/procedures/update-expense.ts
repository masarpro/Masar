import { ORPCError } from "@orpc/server";
import { updateProjectExpense } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateExpense = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/expenses/{expenseId}",
		tags: ["Project Finance"],
		summary: "Update a project expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			expenseId: z.string(),
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
			amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر").optional(),
			vendorName: z.string().nullable().optional(),
			note: z.string().nullable().optional(),
			attachmentUrl: z.string().url().nullable().optional(),
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
