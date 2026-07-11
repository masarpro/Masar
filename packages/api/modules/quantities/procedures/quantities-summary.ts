import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const quantitiesSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/summary",
		tags: ["Quantities"],
		summary: "Get quantities summary counts",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		// التحقق أن الدراسة تخص المنظمة — كانت العدادات تُقرأ بمعرّف خام
		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});
		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: "الدراسة غير موجودة" });
		}

		const [structuralCount, finishingCount, mepCount, manualCount] =
			await Promise.all([
				db.structuralItem.count({
					where: { costStudyId: input.studyId },
				}),
				db.finishingItem.count({
					where: { costStudyId: input.studyId },
				}),
				db.mEPItem.count({
					where: { costStudyId: input.studyId },
				}),
				db.manualItem.count({
					where: {
						costStudyId: input.studyId,
						organizationId: input.organizationId,
					},
				}),
			]);

		return {
			structural: structuralCount,
			finishing: finishingCount,
			mep: mepCount,
			manual: manualCount,
			total: structuralCount + finishingCount + mepCount + manualCount,
		};
	});
