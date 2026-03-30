import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const unlinkQuotation = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}/unlink-quotation",
		tags: ["Leads"],
		summary: "Unlink quotation from a lead",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
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
			data: { quotationId: null },
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
				type: "QUOTATION_UNLINKED",
			},
		});

		return {
			...updated,
			estimatedArea: updated.estimatedArea ? Number(updated.estimatedArea) : null,
			estimatedValue: updated.estimatedValue ? Number(updated.estimatedValue) : null,
		};
	});
