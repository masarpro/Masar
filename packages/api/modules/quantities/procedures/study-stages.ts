import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { hasPermission, type Permissions } from "@repo/database/prisma/permissions";
import { z } from "zod";
import { verifyOrganizationAccess, requirePermission } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
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

const stageTypeEnum = z.enum([
	"QUANTITIES",
	"SPECIFICATIONS",
	"COSTING",
	"PRICING",
	"QUOTATION",
	"CONVERSION",
]);

const STAGE_LABELS: Record<StageType, string> = {
	QUANTITIES: "الكميات",
	SPECIFICATIONS: "المواصفات",
	COSTING: "تسعير التكلفة",
	PRICING: "التسعير",
	QUOTATION: "عرض السعر",
	CONVERSION: "التحويل لمشروع",
};

// Fine-grained approve permissions per stage
const STAGE_APPROVE_PERMISSION: Partial<Record<StageType, string>> = {
	QUANTITIES: "approveQuantities",
	SPECIFICATIONS: "approveSpecs",
	COSTING: "approveCosting",
	PRICING: "editSellingPrice",
	QUOTATION: "generateQuotation",
};

// Map new StudyStage names → old CostStudy field names
const STAGE_TO_COST_STUDY_FIELD: Partial<Record<StageType, string>> = {
	QUANTITIES: "quantitiesStatus",
	SPECIFICATIONS: "specsStatus",
	COSTING: "costingStatus",
	PRICING: "pricingStatus",
	QUOTATION: "quotationStatus",
};

// ═══════════════════════════════════════════════════════════════
// GET STAGES
// ═══════════════════════════════════════════════════════════════

export const getStudyStages = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/study-stages",
		tags: ["Quantities", "StudyStages"],
		summary: "Get study stages from StudyStage table",
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
				entryPoint: true,
				stages: {
					orderBy: { sortOrder: "asc" },
					select: {
						id: true,
						stage: true,
						status: true,
						assigneeId: true,
						approvedById: true,
						approvedAt: true,
						notes: true,
						sortOrder: true,
					},
				},
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		return {
			entryPoint: study.entryPoint,
			stages: study.stages.map((s) => {
				const approveAction = STAGE_APPROVE_PERMISSION[s.stage as StageType];
				const canApprove = approveAction
					? hasPermission(permissions, "pricing", approveAction)
					: false;
				return {
					id: s.id,
					stage: s.stage,
					status: s.status,
					assigneeId: s.assigneeId,
					approvedById: s.approvedById,
					approvedAt: s.approvedAt,
					notes: s.notes,
					sortOrder: s.sortOrder,
					canApprove,
				};
			}),
		};
	});

// ═══════════════════════════════════════════════════════════════
// APPROVE STAGE
// ═══════════════════════════════════════════════════════════════

export const approveStudyStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/study-stages/approve",
		tags: ["Quantities", "StudyStages"],
		summary: "Approve a study stage (from StudyStage table)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: stageTypeEnum,
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
			select: {
				id: true,
				entryPoint: true,
				stages: {
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const stageIndex = STAGE_ORDER.indexOf(input.stage);

		// Check previous stage is approved (or skipped)
		if (stageIndex > 0) {
			const prevStageKey = STAGE_ORDER[stageIndex - 1];
			const prevStageRecord = study.stages.find((s) => s.stage === prevStageKey);
			if (prevStageRecord && prevStageRecord.status !== "APPROVED") {
				throw new ORPCError("BAD_REQUEST", {
					message: `لا يمكن اعتماد "${STAGE_LABELS[input.stage]}" قبل اعتماد "${STAGE_LABELS[prevStageKey]}"`,
				});
			}
		}

		const currentStageRecord = study.stages.find((s) => s.stage === input.stage);
		if (!currentStageRecord) {
			throw new ORPCError("NOT_FOUND", {
				message: "المرحلة غير موجودة",
			});
		}

		// Approve current stage
		await db.studyStage.update({
			where: { id: currentStageRecord.id },
			data: {
				status: "APPROVED",
				approvedById: context.user.id,
				approvedAt: new Date(),
			},
		});

		// Set next stage to DRAFT if currently NOT_STARTED
		if (stageIndex < STAGE_ORDER.length - 1) {
			const nextStageKey = STAGE_ORDER[stageIndex + 1];
			const nextStageRecord = study.stages.find((s) => s.stage === nextStageKey);
			if (nextStageRecord && nextStageRecord.status === "NOT_STARTED") {
				await db.studyStage.update({
					where: { id: nextStageRecord.id },
					data: { status: "DRAFT" },
				});
			}
		}

		// Sync to CostStudy legacy fields
		const costStudyField = STAGE_TO_COST_STUDY_FIELD[input.stage];
		if (costStudyField) {
			const syncData: Record<string, string> = { [costStudyField]: "APPROVED" };
			if (stageIndex < STAGE_ORDER.length - 1) {
				const nextField = STAGE_TO_COST_STUDY_FIELD[STAGE_ORDER[stageIndex + 1]];
				if (nextField) {
					const nextStageRecord = study.stages.find((s) => s.stage === STAGE_ORDER[stageIndex + 1]);
					if (nextStageRecord && nextStageRecord.status === "NOT_STARTED") {
						syncData[nextField] = "DRAFT";
					}
				}
			}
			await db.costStudy.update({
				where: { id: input.studyId },
				data: syncData,
			});
		}

		// Return updated stages
		const updatedStages = await db.studyStage.findMany({
			where: { costStudyId: input.studyId },
			orderBy: { sortOrder: "asc" },
			select: { stage: true, status: true, assigneeId: true },
		});

		return { stages: updatedStages };
	});

// ═══════════════════════════════════════════════════════════════
// REOPEN STAGE
// ═══════════════════════════════════════════════════════════════

export const reopenStudyStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/study-stages/reopen",
		tags: ["Quantities", "StudyStages"],
		summary: "Reopen an approved study stage",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: stageTypeEnum,
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		// Check fine-grained approve permission (reopen requires same permission)
		const approveAction = STAGE_APPROVE_PERMISSION[input.stage];
		if (approveAction) {
			requirePermission(permissions, "pricing", approveAction);
		}

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				stages: { orderBy: { sortOrder: "asc" } },
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const stageIndex = STAGE_ORDER.indexOf(input.stage);

		// Reopen this stage → DRAFT
		const currentStageRecord = study.stages.find((s) => s.stage === input.stage);
		if (!currentStageRecord) {
			throw new ORPCError("NOT_FOUND", {
				message: "المرحلة غير موجودة",
			});
		}

		// Use transaction to update current + all subsequent stages
		await db.$transaction(async (tx) => {
			// Set current to DRAFT
			await tx.studyStage.update({
				where: { id: currentStageRecord.id },
				data: {
					status: "DRAFT",
					approvedById: null,
					approvedAt: null,
				},
			});

			// Set all subsequent stages to NOT_STARTED
			for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
				const nextStageRecord = study.stages.find(
					(s) => s.stage === STAGE_ORDER[i],
				);
				if (nextStageRecord) {
					await tx.studyStage.update({
						where: { id: nextStageRecord.id },
						data: {
							status: "NOT_STARTED",
							approvedById: null,
							approvedAt: null,
						},
					});
				}
			}

			// Sync to CostStudy legacy fields
			const costStudyField = STAGE_TO_COST_STUDY_FIELD[input.stage];
			if (costStudyField) {
				const syncData: Record<string, string> = { [costStudyField]: "DRAFT" };
				for (let i = stageIndex + 1; i < STAGE_ORDER.length; i++) {
					const nextField = STAGE_TO_COST_STUDY_FIELD[STAGE_ORDER[i]];
					if (nextField) {
						syncData[nextField] = "NOT_STARTED";
					}
				}
				await tx.costStudy.update({
					where: { id: input.studyId },
					data: syncData,
				});
			}
		});

		const updatedStages = await db.studyStage.findMany({
			where: { costStudyId: input.studyId },
			orderBy: { sortOrder: "asc" },
			select: { stage: true, status: true, assigneeId: true },
		});

		return { stages: updatedStages };
	});

// ═══════════════════════════════════════════════════════════════
// ASSIGN STAGE
// ═══════════════════════════════════════════════════════════════

export const assignStudyStage = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/study-stages/assign",
		tags: ["Quantities", "StudyStages"],
		summary: "Assign a user to a study stage",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			stage: stageTypeEnum,
			userId: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const stageRecord = await db.studyStage.findFirst({
			where: {
				costStudyId: input.studyId,
				stage: input.stage,
				costStudy: { organizationId: input.organizationId },
			},
		});

		if (!stageRecord) {
			throw new ORPCError("NOT_FOUND", {
				message: "المرحلة غير موجودة",
			});
		}

		await db.studyStage.update({
			where: { id: stageRecord.id },
			data: { assigneeId: input.userId },
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════
// GET ACTIVE STAGE
// ═══════════════════════════════════════════════════════════════

export const getActiveStudyStage = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/study-stages/active",
		tags: ["Quantities", "StudyStages"],
		summary: "Get the first non-approved stage (active stage)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const activeStage = await db.studyStage.findFirst({
			where: {
				costStudyId: input.studyId,
				costStudy: { organizationId: input.organizationId },
				status: { not: "APPROVED" },
			},
			orderBy: { sortOrder: "asc" },
			select: {
				stage: true,
				status: true,
				assigneeId: true,
			},
		});

		return { activeStage };
	});
