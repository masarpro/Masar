import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const linkStudy = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/quantities/link-study",
		tags: ["Project Quantities"],
		summary: "Link an existing cost study to a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		// Verify study belongs to same organization
		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "الدراسة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		// Check study is not already linked to another project
		if (study.projectId !== null) {
			throw new ORPCError("CONFLICT", {
				message: "هذه الدراسة مرتبطة بمشروع آخر بالفعل",
			});
		}

		const updated = await db.costStudy.update({
			where: { id: input.studyId },
			data: { projectId: input.projectId },
		});

		return {
			id: updated.id,
			name: updated.name,
			projectId: updated.projectId,
			totalCost: Number(updated.totalCost),
		};
	});
