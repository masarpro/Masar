import { ORPCError } from "@orpc/server";
import { updateProject } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateProjectProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Update a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			description: z.string().optional(),
			status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
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
			clientId: z.string().nullable().optional(),
			location: z.string().optional(),
			contractValue: z.number().positive().optional(),
			progress: z.number().min(0).max(100).optional(),
			startDate: z.coerce.date().nullable().optional(),
			endDate: z.coerce.date().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to edit
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const project = await updateProject(input.id, input.organizationId, {
				name: input.name,
				description: input.description,
				status: input.status,
				type: input.type,
				clientName: input.clientName,
				clientId: input.clientId,
				location: input.location,
				contractValue: input.contractValue,
				progress: input.progress,
				startDate: input.startDate ?? undefined,
				endDate: input.endDate ?? undefined,
			});

			return {
				...project,
				contractValue: project.contractValue
					? Number(project.contractValue)
					: null,
				progress: Number(project.progress),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فشل في تحديث المشروع",
			});
		}
	});
