import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getAvailableCostStudies = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/available-cost-studies",
		tags: ["Project BOQ"],
		summary: "List cost studies available for copying to BOQ",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			search: z.string().max(200).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		// Get IDs of studies already copied to this project
		const copiedStudies = await db.projectBOQItem.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
				sourceType: "COST_STUDY",
				costStudyId: { not: null },
			},
			select: { costStudyId: true },
			distinct: ["costStudyId"],
		});
		const copiedStudyIds = copiedStudies
			.map((s) => s.costStudyId)
			.filter((id): id is string => id !== null);

		const studies = await db.costStudy.findMany({
			where: {
				organizationId: input.organizationId,
				...(copiedStudyIds.length > 0
					? { id: { notIn: copiedStudyIds } }
					: {}),
				...(input.search
					? {
							name: {
								contains: input.search,
								mode: "insensitive" as const,
							},
						}
					: {}),
			},
			include: {
				_count: {
					select: {
						structuralItems: true,
						finishingItems: true,
						mepItems: true,
						laborItems: true,
					},
				},
			},
			take: 20,
			orderBy: { createdAt: "desc" },
		});

		return studies.map((study) => ({
			id: study.id,
			name: study.name,
			customerName: study.customerName,
			projectType: study.projectType,
			totalCost: Number(study.totalCost),
			status: study.status,
			isLinkedToProject: study.projectId !== null,
			itemCounts: study._count,
			createdAt: study.createdAt,
		}));
	});
