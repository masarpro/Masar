import {
	getOrganizationOpenDocuments,
	getOpenDocumentById,
	createOpenDocument,
	updateOpenDocument,
	deleteOpenDocument,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listOpenDocuments = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/documents",
		tags: ["Finance", "Documents"],
		summary: "List open documents for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			documentType: z
				.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"])
				.optional(),
			projectId: z.string().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await getOrganizationOpenDocuments(input.organizationId, {
			documentType: input.documentType,
			projectId: input.projectId,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});

export const getOpenDocument = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Get an open document by ID",
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

		const document = await getOpenDocumentById(input.id, input.organizationId);

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "المستند غير موجود" });
		}

		return document;
	});

export const createOpenDocumentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/documents",
		tags: ["Finance", "Documents"],
		summary: "Create a new open document",
	})
	.input(
		z.object({
			organizationId: z.string(),
			documentType: z.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"]),
			title: z.string().min(1, "عنوان المستند مطلوب"),
			content: z.string().min(1, "محتوى المستند مطلوب"),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
			recipientName: z.string().optional(),
			recipientCompany: z.string().optional(),
			recipientAddress: z.string().optional(),
			templateId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const document = await createOpenDocument({
			organizationId: input.organizationId,
			createdById: context.user.id,
			documentType: input.documentType,
			title: input.title,
			content: input.content,
			clientId: input.clientId,
			projectId: input.projectId,
			recipientName: input.recipientName,
			recipientCompany: input.recipientCompany,
			recipientAddress: input.recipientAddress,
			templateId: input.templateId,
		});

		return document;
	});

export const updateOpenDocumentProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Update an open document",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			documentType: z.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"]).optional(),
			title: z.string().min(1).optional(),
			content: z.string().min(1).optional(),
			clientId: z.string().nullish(),
			projectId: z.string().nullish(),
			recipientName: z.string().optional(),
			recipientCompany: z.string().optional(),
			recipientAddress: z.string().optional(),
			templateId: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const { organizationId, id, ...data } = input;

		const document = await updateOpenDocument(id, organizationId, {
			...data,
			clientId: data.clientId ?? undefined,
			projectId: data.projectId ?? undefined,
			templateId: data.templateId ?? undefined,
		});

		return document;
	});

export const deleteOpenDocumentProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Delete an open document",
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

		await deleteOpenDocument(input.id, input.organizationId);

		return { success: true };
	});
