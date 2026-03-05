import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const linkCostStudy = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}/link-cost-study",
		tags: ["Leads"],
		summary: "Link a cost study to a lead",
	})
	.input(
		z.object({
			organizationId: z.string(),
			leadId: z.string(),
			costStudyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		// Verify lead belongs to org
		const lead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});
		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		// Verify cost study belongs to org
		const costStudy = await db.costStudy.findFirst({
			where: { id: input.costStudyId, organizationId: input.organizationId },
		});
		if (!costStudy) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		// Check if cost study is already linked to another lead
		const existing = await db.lead.findFirst({
			where: { costStudyId: input.costStudyId },
		});
		if (existing && existing.id !== input.leadId) {
			throw new ORPCError("CONFLICT", {
				message: "دراسة التكلفة مرتبطة بعميل محتمل آخر",
			});
		}

		const updated = await db.lead.update({
			where: { id: input.leadId },
			data: { costStudyId: input.costStudyId },
			include: {
				costStudy: { select: { id: true, name: true, totalCost: true } },
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
			},
		});

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "COST_STUDY_LINKED",
				metadata: { costStudyId: input.costStudyId, costStudyName: costStudy.name },
			},
		});

		return {
			...updated,
			estimatedArea: updated.estimatedArea ? Number(updated.estimatedArea) : null,
			estimatedValue: updated.estimatedValue ? Number(updated.estimatedValue) : null,
			costStudy: updated.costStudy
				? { ...updated.costStudy, totalCost: Number(updated.costStudy.totalCost) }
				: null,
		};
	});
