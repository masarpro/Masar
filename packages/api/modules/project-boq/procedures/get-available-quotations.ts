import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getAvailableQuotations = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/available-quotations",
		tags: ["Project BOQ"],
		summary: "List quotations available for copying to BOQ",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			search: z.string().trim().max(200).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const quotations = await db.quotation.findMany({
			where: {
				organizationId: input.organizationId,
				...(input.search
					? {
							OR: [
								{
									quotationNo: {
										contains: input.search,
										mode: "insensitive" as const,
									},
								},
								{
									clientName: {
										contains: input.search,
										mode: "insensitive" as const,
									},
								},
							],
						}
					: {}),
			},
			include: {
				_count: { select: { items: true } },
				client: { select: { name: true } },
			},
			take: 20,
			orderBy: { createdAt: "desc" },
		});

		return quotations.map((q) => ({
			id: q.id,
			quotationNo: q.quotationNo,
			clientName: q.clientName,
			client: q.client,
			status: q.status,
			totalAmount: Number(q.totalAmount),
			itemCount: q._count.items,
			createdAt: q.createdAt,
		}));
	});
