import { createCostStudy, db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const create = subscriptionProcedure
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
			landArea: z.number().positive().default(1),
			buildingArea: z.number().positive().default(1),
			numberOfFloors: z.number().int().positive().default(1),
			hasBasement: z.boolean().default(false),
			finishingLevel: z.string().default("medium"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
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

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstQuantityAdded: false },
			data: { firstQuantityAdded: true },
		}).catch(() => {});

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
