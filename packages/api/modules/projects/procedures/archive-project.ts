import { ORPCError } from "@orpc/server";
import { updateProject, orgAuditLog, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const archiveProjectProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{id}/archive",
		tags: ["Projects"],
		summary: "Archive a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "delete" },
		);

		// Verify project is not already archived
		const existing = await db.project.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, name: true, status: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "المشروع غير موجود",
			});
		}

		if (existing.status === "ARCHIVED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "المشروع مؤرشف مسبقاً",
			});
		}

		const project = await updateProject(input.id, input.organizationId, {
			status: "ARCHIVED",
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PROJECT_ARCHIVED",
			entityType: "project",
			entityId: input.id,
			metadata: {
				projectName: existing.name,
				previousStatus: existing.status,
			},
		});

		return {
			success: true,
			project: {
				id: project.id,
				name: project.name,
				status: project.status,
			},
		};
	});

export const restoreProjectProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{id}/restore",
		tags: ["Projects"],
		summary: "Restore a project from archive",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "delete" },
		);

		const existing = await db.project.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, name: true, status: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "المشروع غير موجود",
			});
		}

		if (existing.status !== "ARCHIVED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "المشروع ليس مؤرشفاً",
			});
		}

		const project = await updateProject(input.id, input.organizationId, {
			status: "ACTIVE",
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PROJECT_RESTORED",
			entityType: "project",
			entityId: input.id,
			metadata: {
				projectName: existing.name,
			},
		});

		return {
			success: true,
			project: {
				id: project.id,
				name: project.name,
				status: project.status,
			},
		};
	});
