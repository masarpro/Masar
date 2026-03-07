import { createSpecTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const specTemplateCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/spec-templates",
		tags: ["Quantities"],
		summary: "Create spec template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string(),
			nameEn: z.string().optional(),
			description: z.string().optional(),
			specs: z.any(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const { organizationId, ...data } = input;

		const template = await createSpecTemplate({
			...data,
			organizationId,
			createdById: context.user.id,
		});

		return template;
	});
