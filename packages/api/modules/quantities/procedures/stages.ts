import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { z } from "zod";
import { verifyOrganizationAccess, requirePermission } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STAGE_ORDER = ["quantities", "specs", "costing", "pricing", "quotation"] as const;
type StageName = (typeof STAGE_ORDER)[number];

const stageEnum = z.enum(["quantities", "specs", "costing", "pricing", "quotation"]);

const STAGE_FIELD_MAP: Record<StageName, string> = {
	quantities: "quantitiesStatus",
	specs: "specsStatus",
	costing: "costingStatus",
	pricing: "pricingStatus",
	quotation: "quotationStatus",
};

const STAGE_LABELS: Record<StageName, string> = {
	quantities: "الكميات",
	specs: "المواصفات",
	costing: "تسعير التكلفة",
	pricing: "التسعير",
	quotation: "عرض السعر",
};

// Fine-grained approve permissions per stage
const STAGE_APPROVE_PERMISSION: Record<StageName, string> = {
	quantities: "approveQuantities",
	specs: "approveSpecs",
	costing: "approveCosting",
	pricing: "editSellingPrice",
	quotation: "generateQuotation",
};

// Map old stage names → new StudyStage.stage values
const STAGE_TO_STUDY_STAGE = {
	quantities: "QUANTITIES",
	specs: "SPECIFICATIONS",
	costing: "COSTING",
	pricing: "PRICING",
	quotation: "QUOTATION",
} as const;

// ═══════════════════════════════════════════════════════════════
// GET STAGES
// ═══════════════════════════════════════════════════════════════

export const getStages = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/stages",
		tags: ["Quantities", "Stages"],
		summary: "Get stage statuses for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				studyType: true,
				quantitiesStatus: true,
				specsStatus: true,
				costingStatus: true,
				pricingStatus: true,
				quotationStatus: true,
				quantitiesAssigneeId: true,
				specsAssigneeId: true,
				costingAssigneeId: true,
				pricingAssigneeId: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		return {
			studyType: study.studyType,
			stages: {
				quantities: study.quantitiesStatus,
				specs: study.specsStatus,
				costing: study.costingStatus,
				pricing: study.pricingStatus,
				quotation: study.quotationStatus,
			},
			assignees: {
				quantities: study.quantitiesAssigneeId,
				specs: study.specsAssigneeId,
				costing: study.costingAssigneeId,
				pricing: study.pricingAssigneeId,
			},
			canApprove: {
				quantities: hasPermission(permissions, "pricing", "approveQuantities"),
				specs: hasPermission(permissions, "pricing", "approveSpecs"),
				costing: hasPermission(permissions, "pricing", "approveCosting"),
				pricing: hasPermission(permissions, "pricing", "editSellingPrice"),
				quotation: hasPermission(permissions, "pricing", "generateQuotation"),
			},
		};
	});

// ═══════════════════════════════════════════════════════════════
// APPROVE STAGE
// ═══════════════════════════════════════════════════════════════

export const approveStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/stages/approve",
		tags: ["Quantities", "Stages"],
		summary: "Approve a study stage",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: stageEnum,
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		// Check fine-grained approve permission for this stage
		const approveAction = STAGE_APPROVE_PERMISSION[input.stage];
		if (approveAction) {
			requirePermission(permissions, "pricing", approveAction);
		}

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const stageIndex = STAGE_ORDER.indexOf(input.stage);

		// Check previous stage is approved
		if (stageIndex > 0) {
			const prevStage = STAGE_ORDER[stageIndex - 1];
			const prevField = STAGE_FIELD_MAP[prevStage] as keyof typeof study;
			if (study[prevField] !== "APPROVED") {
				throw new ORPCError("BAD_REQUEST", {
					message: `لا يمكن اعتماد "${STAGE_LABELS[input.stage]}" قبل اعتماد "${STAGE_LABELS[prevStage]}"`,
				});
			}
		}

		// Build update data: approve current stage + set next to DRAFT
		const updateData: Record<string, string> = {
			[STAGE_FIELD_MAP[input.stage]]: "APPROVED",
		};

		if (stageIndex < STAGE_ORDER.length - 1) {
			const nextStage = STAGE_ORDER[stageIndex + 1];
			const nextField = STAGE_FIELD_MAP[nextStage];
			// Only set to DRAFT if currently NOT_STARTED
			if ((study as Record<string, unknown>)[nextField] === "NOT_STARTED") {
				updateData[nextField] = "DRAFT";
			}
		}

		const updated = await db.costStudy.update({
			where: { id: input.studyId },
			data: updateData,
			select: {
				quantitiesStatus: true,
				specsStatus: true,
				costingStatus: true,
				pricingStatus: true,
				quotationStatus: true,
			},
		});

		// Sync to StudyStage table
		const studyStageName = STAGE_TO_STUDY_STAGE[input.stage];
		if (studyStageName) {
			await db.studyStage.updateMany({
				where: { costStudyId: input.studyId, stage: studyStageName },
				data: {
					status: "APPROVED",
					approvedById: context.user.id,
					approvedAt: new Date(),
				},
			});

			if (stageIndex < STAGE_ORDER.length - 1) {
				const nextStudyStageName = STAGE_TO_STUDY_STAGE[STAGE_ORDER[stageIndex + 1]];
				if (nextStudyStageName) {
					await db.studyStage.updateMany({
						where: {
							costStudyId: input.studyId,
							stage: nextStudyStageName,
							status: "NOT_STARTED",
						},
						data: { status: "DRAFT" },
					});
				}
			}
		}

		return {
			stages: {
				quantities: updated.quantitiesStatus,
				specs: updated.specsStatus,
				costing: updated.costingStatus,
				pricing: updated.pricingStatus,
				quotation: updated.quotationStatus,
			},
		};
	});

// ═══════════════════════════════════════════════════════════════
// REOPEN STAGE
// ═══════════════════════════════════════════════════════════════

export const reopenStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/stages/reopen",
		tags: ["Quantities", "Stages"],
		summary: "Reopen an approved stage",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: stageEnum,
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		// Check fine-grained approve permission for this stage (reopen requires same permission)
		const approveAction = STAGE_APPROVE_PERMISSION[input.stage];
		if (approveAction) {
			requirePermission(permissions, "pricing", approveAction);
		}

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const stageIndex = STAGE_ORDER.indexOf(input.stage);

		// Reopen this stage → DRAFT, all subsequent → NOT_STARTED
		const updateData: Record<string, string> = {
			[STAGE_FIELD_MAP[input.stage]]: "DRAFT",
		};

		for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
			updateData[STAGE_FIELD_MAP[STAGE_ORDER[i]]] = "NOT_STARTED";
		}

		const updated = await db.costStudy.update({
			where: { id: input.studyId },
			data: updateData,
			select: {
				quantitiesStatus: true,
				specsStatus: true,
				costingStatus: true,
				pricingStatus: true,
				quotationStatus: true,
			},
		});

		// Sync to StudyStage table
		const studyStageName = STAGE_TO_STUDY_STAGE[input.stage];
		if (studyStageName) {
			await db.studyStage.updateMany({
				where: { costStudyId: input.studyId, stage: studyStageName },
				data: {
					status: "DRAFT",
					approvedById: null,
					approvedAt: null,
				},
			});

			for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
				const nextStudyStageName = STAGE_TO_STUDY_STAGE[STAGE_ORDER[i]];
				if (nextStudyStageName) {
					await db.studyStage.updateMany({
						where: { costStudyId: input.studyId, stage: nextStudyStageName },
						data: {
							status: "NOT_STARTED",
							approvedById: null,
							approvedAt: null,
						},
					});
				}
			}
		}

		return {
			stages: {
				quantities: updated.quantitiesStatus,
				specs: updated.specsStatus,
				costing: updated.costingStatus,
				pricing: updated.pricingStatus,
				quotation: updated.quotationStatus,
			},
		};
	});

// ═══════════════════════════════════════════════════════════════
// ASSIGN STAGE
// ═══════════════════════════════════════════════════════════════

const ASSIGNEE_FIELD_MAP: Record<string, string> = {
	quantities: "quantitiesAssigneeId",
	specs: "specsAssigneeId",
	costing: "costingAssigneeId",
	pricing: "pricingAssigneeId",
};

export const assignStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/stages/assign",
		tags: ["Quantities", "Stages"],
		summary: "Assign a user to a stage",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: z.enum(["quantities", "specs", "costing", "pricing"]),
			userId: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const assigneeField = ASSIGNEE_FIELD_MAP[input.stage];
		if (!assigneeField) {
			throw new ORPCError("BAD_REQUEST", {
				message: STUDY_ERRORS.STAGE_ASSIGN,
			});
		}

		await db.costStudy.update({
			where: { id: input.studyId },
			data: { [assigneeField]: input.userId },
		});

		return { success: true };
	});
