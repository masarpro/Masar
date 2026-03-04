import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/vendor-invoices",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "List vendor invoices",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			vendorId: z.string().optional(),
			status: z
				.enum([
					"VI_DRAFT",
					"VI_PENDING_APPROVAL",
					"VI_APPROVED",
					"VI_PARTIALLY_PAID",
					"VI_PAID",
					"VI_DISPUTED",
					"VI_CANCELLED",
				])
				.optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const where: any = { organizationId: input.organizationId };
		if (input.projectId) where.projectId = input.projectId;
		if (input.vendorId) where.vendorId = input.vendorId;
		if (input.status) where.status = input.status;
		if (input.query) {
			where.OR = [
				{ invoiceNumber: { contains: input.query, mode: "insensitive" } },
				{ vendorInvoiceNo: { contains: input.query, mode: "insensitive" } },
			];
		}

		const [invoices, total] = await Promise.all([
			db.vendorInvoice.findMany({
				where,
				include: {
					vendor: { select: { id: true, name: true, code: true } },
					project: { select: { id: true, name: true } },
					purchaseOrder: { select: { id: true, poNumber: true } },
					approvedBy: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.vendorInvoice.count({ where }),
		]);

		return {
			invoices: invoices.map((vi) => ({
				...vi,
				subtotal: Number(vi.subtotal),
				vatPercent: Number(vi.vatPercent),
				vatAmount: Number(vi.vatAmount),
				totalAmount: Number(vi.totalAmount),
				paidAmount: Number(vi.paidAmount),
			})),
			total,
		};
	});
