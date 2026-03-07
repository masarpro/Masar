import { deleteSpecTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const specTemplateDelete = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/quantities/spec-templates/{id}",
		tags: ["Quantities"],
		summary: "Delete spec template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		await deleteSpecTemplate(input.id, input.organizationId);

		return { success: true };
	});
