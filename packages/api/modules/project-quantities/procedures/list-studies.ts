import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { canViewBoqPrices } from "../../project-boq/lib/price-visibility";

export const listStudies = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/studies",
		tags: ["Project Quantities"],
		summary: "List cost studies linked to a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);
		// Study costs and margins are financial data — zeroed without price access
		const money = canViewBoqPrices(permissions)
			? (v: unknown) => Number(v)
			: () => 0;

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
			structuralCost: money(study.structuralCost),
			finishingCost: money(study.finishingCost),
			mepCost: money(study.mepCost),
			laborCost: money(study.laborCost),
			totalCost: money(study.totalCost),
			overheadPercent: money(study.overheadPercent),
			profitPercent: money(study.profitPercent),
			contingencyPercent: money(study.contingencyPercent),
			vatIncluded: study.vatIncluded,
			status: study.status,
			createdAt: study.createdAt,
			itemCounts: study._count,
		}));
	});
