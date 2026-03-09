import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listStudies = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/studies",
		tags: ["Project Quantities"],
		summary: "List cost studies linked to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
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
				projectId: input.projectId,
				organizationId: input.organizationId,
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
			customerName: study.customerName,
			projectType: study.projectType,
			landArea: Number(study.landArea),
			buildingArea: Number(study.buildingArea),
			numberOfFloors: study.numberOfFloors,
			finishingLevel: study.finishingLevel,
			structuralCost: Number(study.structuralCost),
			finishingCost: Number(study.finishingCost),
			mepCost: Number(study.mepCost),
			laborCost: Number(study.laborCost),
			totalCost: Number(study.totalCost),
			overheadPercent: Number(study.overheadPercent),
			profitPercent: Number(study.profitPercent),
			contingencyPercent: Number(study.contingencyPercent),
			vatIncluded: study.vatIncluded,
			status: study.status,
			createdAt: study.createdAt,
			itemCounts: study._count,
		}));
	});
