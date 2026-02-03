import { ORPCError } from "@orpc/server";
import { markActual } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const markActualProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/{milestoneId}/actual",
		tags: ["Project Timeline"],
		summary: "Mark actual progress on a milestone",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string(),
			actualStart: z.string().datetime().optional(),
			actualEnd: z.string().datetime().optional(),
			progress: z.number().min(0).max(100).optional(),
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
			const milestone = await markActual(
				input.organizationId,
				input.projectId,
				input.milestoneId,
				{
					actualStart: input.actualStart
						? new Date(input.actualStart)
						: undefined,
					actualEnd: input.actualEnd ? new Date(input.actualEnd) : undefined,
					progress: input.progress,
				},
			);

			return { milestone };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
		}
	});

export const startMilestoneProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/{milestoneId}/start",
		tags: ["Project Timeline"],
		summary: "Start a milestone (set actual start to today)",
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
			const milestone = await markActual(
				input.organizationId,
				input.projectId,
				input.milestoneId,
				{
					actualStart: new Date(),
				},
			);

			return { milestone };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
		}
	});

export const completeMilestoneProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/{milestoneId}/complete",
		tags: ["Project Timeline"],
		summary: "Complete a milestone (set actual end to today)",
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
			const milestone = await markActual(
				input.organizationId,
				input.projectId,
				input.milestoneId,
				{
					actualEnd: new Date(),
					progress: 100,
				},
			);

			return { milestone };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
		}
	});
