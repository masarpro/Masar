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
			organizationId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			name: z.string().trim().max(100).optional(),
			nameEn: z.string().trim().max(100).optional(),
			description: z.string().trim().max(2000).optional(),
			specs: z.record(z.string(), z.unknown()).optional(),
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
