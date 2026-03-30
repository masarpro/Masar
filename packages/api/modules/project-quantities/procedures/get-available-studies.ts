import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getAvailableStudies = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/available-studies",
		tags: ["Project Quantities"],
		summary: "List unlinked cost studies available for linking",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			search: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const studies = await db.costStudy.findMany({
			where: {
				organizationId: input.organizationId,
				projectId: null,
				...(input.search && {
					name: { contains: input.search, mode: "insensitive" as const },
				}),
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
			orderBy: { createdAt: "desc" },
		});

		return studies.map((study) => ({
			id: study.id,
			name: study.name,
			projectType: study.projectType,
			landArea: Number(study.landArea),
			buildingArea: Number(study.buildingArea),
			numberOfFloors: study.numberOfFloors,
			finishingLevel: study.finishingLevel,
			totalCost: Number(study.totalCost),
			status: study.status,
			createdAt: study.createdAt,
			itemCounts: study._count,
		}));
	});
