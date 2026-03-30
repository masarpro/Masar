import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const updateStatus = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}/status",
		tags: ["Leads"],
		summary: "Update lead status",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
			status: z.enum(["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"]),
			lostReason: z.string().trim().max(2000).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const existingLead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});

		if (!existingLead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		if (input.status === "LOST" && !input.lostReason) {
			throw new ORPCError("BAD_REQUEST", {
				message: "lostReason required when status is LOST",
			});
		}

		const oldStatus = existingLead.status;

		const lead = await db.lead.update({
			where: { id: input.leadId },
			data: {
				status: input.status,
				lostReason: input.status === "LOST" ? input.lostReason : undefined,
			},
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
				type: "STATUS_CHANGE",
				content: null,
				metadata: {
					oldStatus,
					newStatus: input.status,
					lostReason: input.lostReason || null,
				},
			},
		});

		return {
			...lead,
			estimatedArea: lead.estimatedArea ? Number(lead.estimatedArea) : null,
			estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
		};
	});
