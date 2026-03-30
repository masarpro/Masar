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
			organizationId: z.string().trim().max(100),
			name: z.string().trim().max(200),
			nameEn: z.string().trim().max(100).optional(),
			description: z.string().trim().max(2000).optional(),
			specs: z.record(z.string(), z.unknown()),
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
