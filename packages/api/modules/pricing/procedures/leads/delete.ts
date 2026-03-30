import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const deleteLead = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/pricing/leads/{leadId}",
		tags: ["Leads"],
		summary: "Delete a lead",
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

		if (lead.status === "WON") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Cannot delete a converted lead",
			});
		}

		await db.lead.delete({ where: { id: input.leadId } });

		return { success: true };
	});
