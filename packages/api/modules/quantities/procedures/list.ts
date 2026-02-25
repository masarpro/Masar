import { getOrganizationCostStudies } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const list = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities",
		tags: ["Quantities"],
		summary: "List cost studies",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: z.string().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const result = await getOrganizationCostStudies(input.organizationId, {
			status: input.status,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});

		// Convert Decimal to number for JSON serialization
		return {
			costStudies: result.costStudies.map((study) => ({
				...study,
				landArea: Number(study.landArea),
				buildingArea: Number(study.buildingArea),
				structuralCost: Number(study.structuralCost),
				finishingCost: Number(study.finishingCost),
				mepCost: Number(study.mepCost),
				laborCost: Number(study.laborCost),
				overheadPercent: Number(study.overheadPercent),
				profitPercent: Number(study.profitPercent),
				contingencyPercent: Number(study.contingencyPercent),
				totalCost: Number(study.totalCost),
			})),
			total: result.total,
		};
	});
