import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const unlinkCostStudy = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}/unlink-cost-study",
		tags: ["Leads"],
		summary: "Unlink cost study from a lead",
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
		});
		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		const updated = await db.lead.update({
			where: { id: input.leadId },
			data: { costStudyId: null },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
			},
		});

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "COST_STUDY_UNLINKED",
			},
		});

		return {
			...updated,
			estimatedArea: updated.estimatedArea ? Number(updated.estimatedArea) : null,
			estimatedValue: updated.estimatedValue ? Number(updated.estimatedValue) : null,
		};
	});
