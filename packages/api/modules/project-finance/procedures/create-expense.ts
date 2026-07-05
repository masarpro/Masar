import { createProjectExpense, getProjectById } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";
import { idString, positiveAmount, optionalTrimmed, MAX_NAME, MAX_DESC, MAX_URL } from "../../../lib/validation-constants";

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
	MATERIALS: "مواد",
	LABOR: "عمالة",
	EQUIPMENT: "معدات",
	SUBCONTRACTOR: "مقاول باطن",
	TRANSPORT: "نقل",
	MISC: "متنوعة",
};

export const createExpense = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/finance/expenses",
		tags: ["Project Finance"],
		summary: "Create a new project expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			date: z.coerce.date(),
			category: z.enum([
				"MATERIALS",
				"LABOR",
				"EQUIPMENT",
				"SUBCONTRACTOR",
				"TRANSPORT",
				"MISC",
			]),
			amount: positiveAmount(),
			vendorName: optionalTrimmed(MAX_NAME),
			note: optionalTrimmed(MAX_DESC),
			attachmentUrl: z.string().trim().url().max(MAX_URL).optional(),
			subcontractContractId: z.string().trim().max(100).optional(),
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
			subcontractContractId: input.subcontractContractId,
		});

		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event: "projects.expenseCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "expense", id: expense.id },
			data: {
				projectName: project?.name,
				amount: `${new Intl.NumberFormat("en-US").format(Number(expense.amount))} ر.س`,
				category: EXPENSE_CATEGORY_LABELS[input.category] ?? input.category,
			},
		});

		return {
			...expense,
			amount: Number(expense.amount),
		};
	});
