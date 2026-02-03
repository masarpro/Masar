import { ORPCError } from "@orpc/server";
import { updateCostStudy as updateCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const update = protectedProcedure
	.route({
		method: "PUT",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Update cost study",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
			name: z.string().optional(),
			customerName: z.string().optional(),
			customerId: z.string().optional(),
			projectType: z.string().optional(),
			landArea: z.number().positive().optional(),
			buildingArea: z.number().positive().optional(),
			numberOfFloors: z.number().int().positive().optional(),
			hasBasement: z.boolean().optional(),
			finishingLevel: z.string().optional(),
			overheadPercent: z.number().min(0).max(100).optional(),
			profitPercent: z.number().min(0).max(100).optional(),
			contingencyPercent: z.number().min(0).max(100).optional(),
			vatIncluded: z.boolean().optional(),
			status: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		const { id, organizationId, ...data } = input;

		try {
			const study = await updateCostStudyQuery(id, organizationId, data);

			return {
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
			};
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}
	});
