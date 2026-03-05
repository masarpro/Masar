import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { protectedProcedure } from "../../../../orpc/procedures";

export const getById = protectedProcedure
	.route({
		method: "GET",
		path: "/pricing/leads/{leadId}",
		tags: ["Leads"],
		summary: "Get lead by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			leadId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const lead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
				costStudy: {
					select: { id: true, name: true, totalCost: true, projectType: true, createdAt: true },
				},
				quotation: {
					select: {
						id: true,
						quotationNo: true,
						totalAmount: true,
						status: true,
						validUntil: true,
					},
				},
				files: {
					select: {
						id: true,
						name: true,
						fileUrl: true,
						category: true,
						fileSize: true,
						mimeType: true,
						description: true,
						createdAt: true,
						createdBy: { select: { id: true, name: true } },
					},
				},
				activities: {
					orderBy: { createdAt: "desc" },
					take: 50,
					select: {
						id: true,
						type: true,
						content: true,
						metadata: true,
						createdAt: true,
						createdBy: { select: { id: true, name: true, image: true } },
					},
				},
			},
		});

		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		return {
			...lead,
			estimatedArea: lead.estimatedArea ? Number(lead.estimatedArea) : null,
			estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
			costStudy: lead.costStudy
				? { ...lead.costStudy, totalCost: Number(lead.costStudy.totalCost) }
				: null,
			quotation: lead.quotation
				? { ...lead.quotation, totalAmount: Number(lead.quotation.totalAmount) }
				: null,
		};
	});
