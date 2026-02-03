import { ORPCError } from "@orpc/server";
import { updateMilestone, deleteMilestone, reorderMilestones } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateMilestoneProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/project-timeline/milestones/{milestoneId}",
		tags: ["Project Timeline"],
		summary: "Update a milestone",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string(),
			title: z.string().min(1).max(200).optional(),
			description: z.string().max(2000).optional(),
			orderIndex: z.number().int().min(0).optional(),
			plannedStart: z.string().datetime().optional().nullable(),
			plannedEnd: z.string().datetime().optional().nullable(),
			isCritical: z.boolean().optional(),
			status: z
				.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED"])
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const milestone = await updateMilestone(
				input.organizationId,
				input.projectId,
				input.milestoneId,
				{
					title: input.title,
					description: input.description,
					orderIndex: input.orderIndex,
					plannedStart: input.plannedStart
						? new Date(input.plannedStart)
						: input.plannedStart === null
							? undefined
							: undefined,
					plannedEnd: input.plannedEnd
						? new Date(input.plannedEnd)
						: input.plannedEnd === null
							? undefined
							: undefined,
					isCritical: input.isCritical,
					status: input.status,
				},
			);

			return { milestone };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
		}
	});

export const deleteMilestoneProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-timeline/milestones/{milestoneId}",
		tags: ["Project Timeline"],
		summary: "Delete a milestone",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			await deleteMilestone(
				input.organizationId,
				input.projectId,
				input.milestoneId,
			);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
		}
	});

export const reorderMilestonesProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/reorder",
		tags: ["Project Timeline"],
		summary: "Reorder milestones",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneIds: z.array(z.string()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const milestones = await reorderMilestones(
			input.organizationId,
			input.projectId,
			input.milestoneIds,
		);

		return { milestones };
	});
