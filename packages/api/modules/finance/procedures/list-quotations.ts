import { getOrganizationQuotations, getQuotationById } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listQuotations = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/quotations",
		tags: ["Finance", "Quotations"],
		summary: "List quotations for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: z
				.enum([
					"DRAFT",
					"SENT",
					"VIEWED",
					"ACCEPTED",
					"REJECTED",
					"EXPIRED",
					"CONVERTED",
				])
				.optional(),
			clientId: z.string().optional(),
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

		const result = await getOrganizationQuotations(input.organizationId, {
			status: input.status,
			clientId: input.clientId,
			projectId: input.projectId,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});

		// Convert Decimal to number for JSON serialization
		return {
			quotations: result.quotations.map((q) => ({
				...q,
				subtotal: Number(q.subtotal),
				discountPercent: Number(q.discountPercent),
				discountAmount: Number(q.discountAmount),
				vatPercent: Number(q.vatPercent),
				vatAmount: Number(q.vatAmount),
				totalAmount: Number(q.totalAmount),
			})),
			total: result.total,
		};
	});

export const getQuotation = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/quotations/{id}",
		tags: ["Finance", "Quotations"],
		summary: "Get a quotation by ID",
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

		const quotation = await getQuotationById(input.id, input.organizationId);

		if (!quotation) {
			throw new ORPCError("NOT_FOUND", { message: "عرض السعر غير موجود" });
		}

		// Convert Decimal to number for JSON serialization
		return {
			...quotation,
			subtotal: Number(quotation.subtotal),
			discountPercent: Number(quotation.discountPercent),
			discountAmount: Number(quotation.discountAmount),
			vatPercent: Number(quotation.vatPercent),
			vatAmount: Number(quotation.vatAmount),
			totalAmount: Number(quotation.totalAmount),
			items: quotation.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});
