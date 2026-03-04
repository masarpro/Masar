import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/rfq",
		tags: ["Procurement", "RFQ"],
		summary: "List RFQs",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			status: z
				.enum([
					"RFQ_DRAFT",
					"SENT",
					"RESPONSES_RECEIVED",
					"EVALUATED",
					"AWARDED",
					"RFQ_CANCELLED",
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
		if (input.status) where.status = input.status;
		if (input.query) {
			where.OR = [
				{ title: { contains: input.query, mode: "insensitive" } },
				{ rfqNumber: { contains: input.query, mode: "insensitive" } },
			];
		}

		const [rfqs, total] = await Promise.all([
			db.rFQ.findMany({
				where,
				include: {
					project: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
					awardedVendor: { select: { id: true, name: true } },
					_count: { select: { items: true, vendorResponses: true } },
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.rFQ.count({ where }),
		]);

		return { rfqs, total };
	});
