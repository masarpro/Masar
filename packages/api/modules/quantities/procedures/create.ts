import { createCostStudy, db } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT → STAGE STATUS MAPPING
// ═══════════════════════════════════════════════════════════════

const STAGE_ORDER = [
	"QUANTITIES",
	"SPECIFICATIONS",
	"COSTING",
	"PRICING",
	"QUOTATION",
	"CONVERSION",
] as const;

type StageType = (typeof STAGE_ORDER)[number];
type StageStatus = "NOT_STARTED" | "DRAFT" | "APPROVED";

const ENTRY_POINT_START_INDEX: Record<string, number> = {
	FROM_SCRATCH: 0,
	HAS_QUANTITIES: 1,
	HAS_SPECS: 2,
	QUOTATION_ONLY: 4,
	LUMP_SUM_ANALYSIS: 2,
	CUSTOM_ITEMS: 0,
};

// Map stage types to CostStudy legacy field names
const STAGE_TO_COST_STUDY_FIELD: Record<StageType, string> = {
	QUANTITIES: "quantitiesStatus",
	SPECIFICATIONS: "specsStatus",
	COSTING: "costingStatus",
	PRICING: "pricingStatus",
	QUOTATION: "quotationStatus",
	CONVERSION: "quotationStatus", // No separate field for conversion
};

function getStageStatuses(entryPoint: string): Array<{ stage: StageType; status: StageStatus; sortOrder: number }> {
	const startIndex = ENTRY_POINT_START_INDEX[entryPoint] ?? 0;

	return STAGE_ORDER.map((stage, index) => {
		let status: StageStatus;
		if (index < startIndex) {
			status = "APPROVED"; // Skipped stages
		} else if (index === startIndex) {
			status = "DRAFT"; // Entry point stage
		} else {
			status = "NOT_STARTED";
		}
		return { stage, status, sortOrder: index + 1 };
	});
}

/** Build CostStudy legacy field updates to match StudyStage statuses */
function getCostStudyStatusFields(stageStatuses: Array<{ stage: StageType; status: StageStatus }>): Record<string, string> {
	const fields: Record<string, string> = {};
	for (const { stage, status } of stageStatuses) {
		const field = STAGE_TO_COST_STUDY_FIELD[stage];
		if (field && stage !== "CONVERSION") {
			fields[field] = status;
		}
	}
	return fields;
}

// ═══════════════════════════════════════════════════════════════
// CREATE PROCEDURE
// ═══════════════════════════════════════════════════════════════

export const create = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities",
		tags: ["Quantities"],
		summary: "Create cost study",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			name: z.string().trim().max(100).optional(),
			customerName: z.string().trim().max(100).optional(),
			customerId: z.string().trim().max(100).optional(),
			projectType: z.string().trim().max(100),
			landArea: z.number().positive().default(1),
			buildingArea: z.number().positive().default(1),
			numberOfFloors: z.number().int().positive().default(1),
			hasBasement: z.boolean().default(false),
			finishingLevel: z.string().trim().max(100).default("medium"),
			studyType: z.enum(["FULL_PROJECT", "CUSTOM_ITEMS", "LUMP_SUM_ANALYSIS", "FULL_STUDY", "COST_PRICING", "QUICK_PRICING"]).default("FULL_PROJECT"),
			contractValue: z.number().positive().optional(),
			entryPoint: z.enum([
				"FROM_SCRATCH",
				"HAS_QUANTITIES",
				"HAS_SPECS",
				"QUOTATION_ONLY",
				"LUMP_SUM_ANALYSIS",
				"CUSTOM_ITEMS",
			]).default("FROM_SCRATCH"),
			workScopes: z.array(z.enum(["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"])).optional().default([]),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Auto-map new study types to entryPoint
		let entryPoint = input.entryPoint;
		if (input.studyType === "FULL_STUDY") {
			entryPoint = "FROM_SCRATCH";
		} else if (input.studyType === "COST_PRICING") {
			entryPoint = "FROM_SCRATCH";
		} else if (input.studyType === "QUICK_PRICING") {
			entryPoint = "QUOTATION_ONLY";
		}

		const stageStatuses = getStageStatuses(entryPoint);

		// Fix: QUICK_PRICING users are redirected to /pricing, so PRICING stage
		// should be DRAFT (active), not APPROVED. QUOTATION_ONLY entry point
		// marks everything before QUOTATION as APPROVED, but PRICING is the
		// actual starting point for QUICK_PRICING.
		if (input.studyType === "QUICK_PRICING") {
			const pricingStage = stageStatuses.find((s) => s.stage === "PRICING");
			if (pricingStage) {
				pricingStage.status = "DRAFT";
			}
		}

		const costStudyFields = getCostStudyStatusFields(stageStatuses);

		const result = await db.$transaction(async (tx) => {
			// 1. Create the CostStudy with correct stage statuses
			const study = await tx.costStudy.create({
				data: {
					organizationId: input.organizationId,
					createdById: context.user.id,
					name: input.name,
					customerName: input.customerName,
					customerId: input.customerId,
					projectType: input.projectType,
					landArea: input.landArea,
					buildingArea: input.buildingArea,
					numberOfFloors: input.numberOfFloors,
					hasBasement: input.hasBasement ?? false,
					finishingLevel: input.finishingLevel,
					studyType: input.studyType,
					contractValue: input.contractValue,
					entryPoint,
					workScopes: input.workScopes,
					...costStudyFields,
				},
			});

			// 2. Create 6 StudyStage records
			await tx.studyStage.createMany({
				data: stageStatuses.map((s) => ({
					costStudyId: study.id,
					stage: s.stage,
					status: s.status,
					sortOrder: s.sortOrder,
				})),
			});

			return study;
		});

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstQuantityAdded: false },
			data: { firstQuantityAdded: true },
		}).catch(() => {});

		return convertStudyDecimals(result);
	});
