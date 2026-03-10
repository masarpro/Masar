import { createCostStudy, db } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
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
			studyType: z.enum(["FULL_PROJECT", "CUSTOM_ITEMS", "LUMP_SUM_ANALYSIS"]).default("FULL_PROJECT"),
			contractValue: z.number().positive().optional(),
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
			studyType: input.studyType,
			contractValue: input.contractValue,
		});

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstQuantityAdded: false },
			data: { firstQuantityAdded: true },
		}).catch(() => {});

		return convertStudyDecimals(study);
	});
