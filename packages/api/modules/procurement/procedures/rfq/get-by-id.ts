import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/rfq/{rfqId}",
		tags: ["Procurement", "RFQ"],
		summary: "Get RFQ details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			rfqId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const rfq = await db.rFQ.findFirst({
			where: { id: input.rfqId, organizationId: input.organizationId },
			include: {
				project: { select: { id: true, name: true } },
				purchaseRequest: {
					select: { id: true, prNumber: true, title: true },
				},
				createdBy: { select: { id: true, name: true } },
				awardedVendor: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				vendorResponses: {
					include: {
						vendor: {
							select: { id: true, name: true, code: true },
						},
					},
					orderBy: { receivedAt: "desc" },
				},
			},
		});

		if (!rfq) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب عرض السعر غير موجود",
			});
		}

		return {
			...rfq,
			items: rfq.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
			})),
			vendorResponses: rfq.vendorResponses.map((r) => ({
				...r,
				totalAmount: Number(r.totalAmount),
				technicalScore: r.technicalScore ? Number(r.technicalScore) : null,
				priceScore: r.priceScore ? Number(r.priceScore) : null,
				overallScore: r.overallScore ? Number(r.overallScore) : null,
			})),
		};
	});
