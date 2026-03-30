import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const unlinkStudy = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/quantities/unlink-study",
		tags: ["Project Quantities"],
		summary: "Unlink a cost study from a project",
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

		// Verify study is linked to this project
		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "الدراسة غير موجودة أو غير مرتبطة بهذا المشروع",
			});
		}

		// Unlink study and clear phase assignments in a transaction
		const [updated] = await db.$transaction([
			db.costStudy.update({
				where: { id: input.studyId },
				data: { projectId: null },
			}),
			db.structuralItem.updateMany({
				where: { costStudyId: input.studyId },
				data: { projectPhaseId: null },
			}),
			db.finishingItem.updateMany({
				where: { costStudyId: input.studyId },
				data: { projectPhaseId: null },
			}),
			db.mEPItem.updateMany({
				where: { costStudyId: input.studyId },
				data: { projectPhaseId: null },
			}),
			db.laborItem.updateMany({
				where: { costStudyId: input.studyId },
				data: { projectPhaseId: null },
			}),
		]);

		return {
			id: updated.id,
			name: updated.name,
			projectId: updated.projectId,
			totalCost: Number(updated.totalCost),
		};
	});
