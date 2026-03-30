import {
	listRecurringTemplates,
	createRecurringTemplate,
	updateRecurringTemplate,
	deleteRecurringTemplate,
	generateDueRecurringEntries,
} from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_ARRAY,
	idString, financialAmount, optionalTrimmed,
} from "../../../lib/validation-constants";

export const listRecurringTemplatesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/recurring",
		tags: ["Accounting", "Recurring"],
		summary: "List recurring journal entry templates",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});
		return listRecurringTemplates(db, input.organizationId);
	});

export const createRecurringTemplateProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/recurring",
		tags: ["Accounting", "Recurring"],
		summary: "Create recurring journal entry template",
	})
	.input(
		z.object({
			organizationId: idString(),
			description: z.string().trim().min(1).max(MAX_DESC),
			lines: z.array(z.object({
				accountId: idString(),
				debit: financialAmount(),
				credit: financialAmount(),
				description: optionalTrimmed(MAX_DESC),
				projectId: idString().optional(),
			})).min(2).max(MAX_ARRAY),
			frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
			dayOfMonth: z.number().int().min(1).max(28).default(1),
			startDate: z.string().datetime(),
			endDate: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return createRecurringTemplate(db, input.organizationId, {
			description: input.description,
			lines: input.lines,
			frequency: input.frequency,
			dayOfMonth: input.dayOfMonth,
			startDate: new Date(input.startDate),
			endDate: input.endDate ? new Date(input.endDate) : undefined,
			createdById: context.user.id,
		});
	});

export const updateRecurringTemplateProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/accounting/recurring/{id}",
		tags: ["Accounting", "Recurring"],
		summary: "Update recurring template",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			description: optionalTrimmed(MAX_DESC),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		const template = await db.recurringJournalTemplate.findUnique({ where: { id: input.id } });
		if (!template || template.organizationId !== input.organizationId) {
			throw new Error("Template not found");
		}

		return updateRecurringTemplate(db, input.id, {
			description: input.description,
			isActive: input.isActive,
		});
	});

export const deleteRecurringTemplateProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/accounting/recurring/{id}",
		tags: ["Accounting", "Recurring"],
		summary: "Delete recurring template",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "delete",
		});

		const template = await db.recurringJournalTemplate.findUnique({ where: { id: input.id } });
		if (!template || template.organizationId !== input.organizationId) {
			throw new Error("Template not found");
		}

		await deleteRecurringTemplate(db, input.id);
		return { success: true };
	});

export const generateDueEntriesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/recurring/generate",
		tags: ["Accounting", "Recurring"],
		summary: "Generate due recurring journal entries",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return generateDueRecurringEntries(db, input.organizationId, context.user.id);
	});
