import { updateSpecTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const specTemplateUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/spec-templates/{id}",
		tags: ["Quantities"],
		summary: "Update spec template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().optional(),
			nameEn: z.string().optional(),
			description: z.string().optional(),
			specs: z.any().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const { organizationId, id, ...data } = input;

		const template = await updateSpecTemplate(id, organizationId, data);

		return template;
	});
