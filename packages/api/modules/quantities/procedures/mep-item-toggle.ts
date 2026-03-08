import { ORPCError } from "@orpc/server";
import { toggleMEPItemEnabled, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const mepItemToggle = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/mep-items/{id}/toggle",
		tags: ["Quantities"],
		summary: "Toggle MEP item enabled status",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			id: z.string(),
			isEnabled: z.boolean(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const item = await toggleMEPItemEnabled(input.id, input.costStudyId, input.isEnabled);

		return {
			...item,
			quantity: Number(item.quantity),
			totalCost: Number(item.totalCost),
		};
	});
