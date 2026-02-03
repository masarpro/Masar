import { ORPCError } from "@orpc/server";
import { getTemplateById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getTemplateProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-templates/{id}",
		tags: ["Project Templates"],
		summary: "Get a project template by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to view templates
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const template = await getTemplateById(input.id, input.organizationId);

		if (!template) {
			throw new ORPCError("NOT_FOUND", {
				message: "القالب غير موجود",
			});
		}

		return template;
	});
