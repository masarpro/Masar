import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const addActivity = subscriptionProcedure
	.route({
		method: "POST",
		path: "/pricing/leads/{leadId}/activities",
		tags: ["Leads"],
		summary: "Add a comment to a lead",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
			content: z.string().trim().min(1).max(2000),
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

		const activity = await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "COMMENT",
				content: input.content.trim(),
			},
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
		});

		// Touch lead updatedAt
		await db.lead.update({
			where: { id: input.leadId },
			data: { updatedAt: new Date() },
		});

		return activity;
	});
