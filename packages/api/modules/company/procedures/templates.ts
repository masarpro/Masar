import {
	getOrganizationFinanceTemplates,
	getFinanceTemplateById,
	getDefaultFinanceTemplate,
	createFinanceTemplate,
	updateFinanceTemplate,
	setDefaultFinanceTemplate,
	deleteFinanceTemplate,
	createDefaultTemplatesForOrganization,
	seedAdditionalInvoiceTemplates,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listFinanceTemplates = protectedProcedure
	.route({
		method: "GET",
		path: "/company/templates",
		tags: ["Company", "Templates"],
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
		path: "/company/templates/{id}",
		tags: ["Company", "Templates"],
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
		path: "/company/templates/default",
		tags: ["Company", "Templates"],
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

export const createFinanceTemplateProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/templates",
		tags: ["Company", "Templates"],
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

export const updateFinanceTemplateProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/templates/{id}",
		tags: ["Company", "Templates"],
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

		try {
			const template = await updateFinanceTemplate(id, organizationId, data);
			return template;
		} catch (error) {
			if (error instanceof Error && error.message === "Template not found") {
				throw new ORPCError("NOT_FOUND", { message: "القالب غير موجود" });
			}
			throw error;
		}
	});

export const setDefaultTemplateProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/templates/{id}/set-default",
		tags: ["Company", "Templates"],
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

export const deleteFinanceTemplateProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/company/templates/{id}",
		tags: ["Company", "Templates"],
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

export const seedDefaultTemplates = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/templates/seed",
		tags: ["Company", "Templates"],
		summary: "Seed default templates for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		await createDefaultTemplatesForOrganization(
			input.organizationId,
			context.user.id,
		);

		// Also seed additional invoice templates
		await seedAdditionalInvoiceTemplates(
			input.organizationId,
			context.user.id,
		);

		return { success: true };
	});
