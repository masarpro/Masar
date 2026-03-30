import { setDefaultSpecTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const specTemplateSetDefault = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/spec-templates/{id}/set-default",
		tags: ["Quantities"],
		summary: "Set default spec template",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			id: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const template = await setDefaultSpecTemplate(input.id, input.organizationId);

		return template;
	});
