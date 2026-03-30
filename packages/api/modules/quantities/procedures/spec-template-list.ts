import { getSpecTemplates } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const specTemplateList = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/spec-templates",
		tags: ["Quantities"],
		summary: "List spec templates",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const templates = await getSpecTemplates(input.organizationId);

		return templates;
	});
