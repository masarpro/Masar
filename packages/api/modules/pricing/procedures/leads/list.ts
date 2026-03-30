import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { protectedProcedure } from "../../../../orpc/procedures";

export const list = protectedProcedure
	.route({
		method: "GET",
		path: "/pricing/leads",
		tags: ["Leads"],
		summary: "List leads",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			status: z.string().trim().max(50).optional(),
			source: z.string().trim().max(50).optional(),
			priority: z.string().trim().max(50).optional(),
			assignedToId: z.string().trim().max(100).optional(),
			search: z.string().trim().max(200).optional(),
			page: z.number().int().positive().max(1000).optional().default(1),
			limit: z.number().optional().default(20).pipe(z.number().max(100)),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const { organizationId, status, source, priority, assignedToId, search, page, limit } = input;

		const where: Record<string, unknown> = { organizationId };
		if (status) where.status = status;
		if (source) where.source = source;
		if (priority) where.priority = priority;
		if (assignedToId) where.assignedToId = assignedToId;

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ phone: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ company: { contains: search, mode: "insensitive" } },
			];
		}

		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			db.lead.findMany({
				where,
				include: {
					createdBy: { select: { id: true, name: true, image: true } },
					assignedTo: { select: { id: true, name: true, image: true } },
					costStudy: { select: { id: true, name: true, totalCost: true } },
					quotation: { select: { id: true, quotationNo: true, totalAmount: true, status: true } },
					_count: { select: { files: true, activities: true } },
				},
				orderBy: { updatedAt: "desc" },
				skip,
				take: limit,
			}),
			db.lead.count({ where }),
		]);

		return {
			items: items.map((item) => ({
				...item,
				estimatedArea: item.estimatedArea ? Number(item.estimatedArea) : null,
				estimatedValue: item.estimatedValue ? Number(item.estimatedValue) : null,
				costStudy: item.costStudy
					? { ...item.costStudy, totalCost: Number(item.costStudy.totalCost) }
					: null,
				quotation: item.quotation
					? { ...item.quotation, totalAmount: Number(item.quotation.totalAmount) }
					: null,
			})),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	});
