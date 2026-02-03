import { createProject } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const createProjectProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects",
		tags: ["Projects"],
		summary: "Create a new project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم المشروع مطلوب"),
			description: z.string().optional(),
			type: z
				.enum([
					"RESIDENTIAL",
					"COMMERCIAL",
					"INDUSTRIAL",
					"INFRASTRUCTURE",
					"MIXED",
				])
				.optional(),
			clientName: z.string().optional(),
			location: z.string().optional(),
			contractValue: z.number().positive().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to create projects
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "create" },
		);

		const project = await createProject({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			description: input.description,
			type: input.type,
			clientName: input.clientName,
			location: input.location,
			contractValue: input.contractValue,
			startDate: input.startDate,
			endDate: input.endDate,
		});

		return {
			...project,
			contractValue: project.contractValue
				? Number(project.contractValue)
				: null,
			progress: Number(project.progress),
		};
	});
