import { createProjectExpense, getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyExpenseCreated, getProjectAccountants } from "../../notifications/lib/notification-service";

export const createExpense = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/finance/expenses",
		tags: ["Project Finance"],
		summary: "Create a new project expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			date: z.coerce.date(),
			category: z.enum([
				"MATERIALS",
				"LABOR",
				"EQUIPMENT",
				"SUBCONTRACTOR",
				"TRANSPORT",
				"MISC",
			]),
			amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
			vendorName: z.string().optional(),
			note: z.string().optional(),
			attachmentUrl: z.string().url().optional(),
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

		const expense = await createProjectExpense({
			organizationId: input.organizationId,
			projectId: input.projectId,
			createdById: context.user.id,
			date: input.date,
			category: input.category,
			amount: input.amount,
			vendorName: input.vendorName,
			note: input.note,
			attachmentUrl: input.attachmentUrl,
		});

		// Notify project accountants (fire and forget)
		getProjectById(input.projectId, input.organizationId)
			.then(async (project) => {
				if (project) {
					const accountantIds = await getProjectAccountants(input.projectId);
					if (accountantIds.length > 0) {
						notifyExpenseCreated({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							expenseId: expense.id,
							amount: input.amount.toLocaleString("ar-SA"),
							category: input.category,
							creatorId: context.user.id,
							accountantIds,
						}).catch(() => {
							// Silently ignore notification errors
						});
					}
				}
			})
			.catch(() => {
				// Silently ignore errors
			});

		return {
			...expense,
			amount: Number(expense.amount),
		};
	});
