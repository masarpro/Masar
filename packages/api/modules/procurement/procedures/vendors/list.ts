import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const vendorsList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/vendors",
		tags: ["Procurement", "Vendors"],
		summary: "List vendors for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			query: z.string().optional(),
			type: z
				.enum([
					"SUPPLIER",
					"SUBCONTRACTOR_VENDOR",
					"EQUIPMENT_VENDOR",
					"SERVICE_VENDOR",
				])
				.optional(),
			isActive: z.boolean().optional(),
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
		if (input.type) where.type = input.type;
		if (input.isActive !== undefined) where.isActive = input.isActive;
		if (input.query) {
			where.OR = [
				{ name: { contains: input.query, mode: "insensitive" } },
				{ nameEn: { contains: input.query, mode: "insensitive" } },
				{ code: { contains: input.query, mode: "insensitive" } },
				{ email: { contains: input.query, mode: "insensitive" } },
			];
		}

		const [vendors, total] = await Promise.all([
			db.vendor.findMany({
				where,
				include: {
					createdBy: { select: { id: true, name: true } },
					_count: {
						select: {
							purchaseOrders: true,
							vendorInvoices: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.vendor.count({ where }),
		]);

		return {
			vendors: vendors.map((v) => ({
				...v,
				rating: v.rating ? Number(v.rating) : null,
			})),
			total,
		};
	});
