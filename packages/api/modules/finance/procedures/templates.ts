import {
	getOrganizationFinanceTemplates,
	getFinanceTemplateById,
	getDefaultFinanceTemplate,
	createFinanceTemplate,
	updateFinanceTemplate,
	setDefaultFinanceTemplate,
	deleteFinanceTemplate,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listFinanceTemplates = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/templates",
		tags: ["Finance", "Templates"],
		summary: "List finance templates for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			templateType: z.enum(["QUOTATION", "INVOICE", "LETTER"]).optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await getOrganizationFinanceTemplates(input.organizationId, {
			templateType: input.templateType,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});

export const getFinanceTemplate = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/templates/{id}",
		tags: ["Finance", "Templates"],
		summary: "Get a finance template by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const template = await getFinanceTemplateById(input.id, input.organizationId);

		if (!template) {
			throw new ORPCError("NOT_FOUND", { message: "القالب غير موجود" });
		}

		return template;
	});

export const getDefaultTemplate = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/templates/default",
		tags: ["Finance", "Templates"],
		summary: "Get the default template for a type",
	})
	.input(
		z.object({
			organizationId: z.string(),
			templateType: z.enum(["QUOTATION", "INVOICE", "LETTER"]),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const template = await getDefaultFinanceTemplate(
			input.organizationId,
			input.templateType,
		);

		return template;
	});

export const createFinanceTemplateProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/templates",
		tags: ["Finance", "Templates"],
		summary: "Create a new finance template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم القالب مطلوب"),
			description: z.string().optional(),
			templateType: z.enum(["QUOTATION", "INVOICE", "LETTER"]),
			content: z.record(z.string(), z.any()).optional(),
			settings: z.record(z.string(), z.any()).optional(),
			isDefault: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const template = await createFinanceTemplate({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			description: input.description,
			templateType: input.templateType,
			content: input.content,
			settings: input.settings,
			isDefault: input.isDefault,
		});

		return template;
	});

export const updateFinanceTemplateProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/templates/{id}",
		tags: ["Finance", "Templates"],
		summary: "Update a finance template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			description: z.string().optional(),
			content: z.record(z.string(), z.any()).optional(),
			settings: z.record(z.string(), z.any()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const { organizationId, id, ...data } = input;

		const template = await updateFinanceTemplate(id, organizationId, data);

		return template;
	});

export const setDefaultTemplateProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/templates/{id}/set-default",
		tags: ["Finance", "Templates"],
		summary: "Set a template as default for its type",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const template = await setDefaultFinanceTemplate(
			input.id,
			input.organizationId,
		);

		return template;
	});

export const deleteFinanceTemplateProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/templates/{id}",
		tags: ["Finance", "Templates"],
		summary: "Delete a finance template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		await deleteFinanceTemplate(input.id, input.organizationId);

		return { success: true };
	});
