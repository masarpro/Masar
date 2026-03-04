import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/purchase-requests",
		tags: ["Procurement", "Purchase Requests"],
		summary: "List purchase requests",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			status: z
				.enum([
					"PR_DRAFT",
					"PR_PENDING",
					"PR_APPROVED",
					"PR_REJECTED",
					"PARTIALLY_ORDERED",
					"FULLY_ORDERED",
					"PR_CANCELLED",
				])
				.optional(),
			priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
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
		if (input.status) where.status = input.status;
		if (input.priority) where.priority = input.priority;
		if (input.query) {
			where.OR = [
				{ title: { contains: input.query, mode: "insensitive" } },
				{ prNumber: { contains: input.query, mode: "insensitive" } },
			];
		}

		const [requests, total] = await Promise.all([
			db.purchaseRequest.findMany({
				where,
				include: {
					project: { select: { id: true, name: true, slug: true } },
					requestedBy: { select: { id: true, name: true } },
					approvedBy: { select: { id: true, name: true } },
					_count: { select: { items: true, purchaseOrders: true } },
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.purchaseRequest.count({ where }),
		]);

		return {
			requests: requests.map((r) => ({
				...r,
				estimatedTotal: Number(r.estimatedTotal),
			})),
			total,
		};
	});
