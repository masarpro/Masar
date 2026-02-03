import { createCostStudy } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const create = protectedProcedure
	.route({
		method: "POST",
		path: "/quantities",
		tags: ["Quantities"],
		summary: "Create cost study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().optional(),
			customerName: z.string().optional(),
			customerId: z.string().optional(),
			projectType: z.string(),
			landArea: z.number().positive(),
			buildingArea: z.number().positive(),
			numberOfFloors: z.number().int().positive(),
			hasBasement: z.boolean().default(false),
			finishingLevel: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		const study = await createCostStudy({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			customerName: input.customerName,
			customerId: input.customerId,
			projectType: input.projectType,
			landArea: input.landArea,
			buildingArea: input.buildingArea,
			numberOfFloors: input.numberOfFloors,
			hasBasement: input.hasBasement,
			finishingLevel: input.finishingLevel,
		});

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
	});
