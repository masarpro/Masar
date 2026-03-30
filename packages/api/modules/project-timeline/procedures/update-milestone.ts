import { ORPCError } from "@orpc/server";
import { updateMilestone, deleteMilestone, reorderMilestones } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const updateMilestoneProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/project-timeline/milestones/{milestoneId}",
		tags: ["Project Timeline"],
		summary: "Update a milestone",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestoneId: z.string().trim().max(100),
			title: z.string().trim().min(1).max(200).optional(),
			description: z.string().trim().max(2000).optional(),
			orderIndex: z.number().int().min(0).optional(),
			plannedStart: z.string().datetime().optional().nullable(),
			plannedEnd: z.string().datetime().optional().nullable(),
			isCritical: z.boolean().optional(),
			status: z
				.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"])
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

export const deleteMilestoneProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-timeline/milestones/{milestoneId}",
		tags: ["Project Timeline"],
		summary: "Delete a milestone",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestoneId: z.string().trim().max(100),
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

export const reorderMilestonesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/reorder",
		tags: ["Project Timeline"],
		summary: "Reorder milestones",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestoneIds: z.array(z.string().trim().max(100)).max(1000),
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
