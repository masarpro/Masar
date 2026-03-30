import { createProject, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	positiveAmount,
	financialAmount,
	percentage,
	dayCount,
	MAX_NAME,
	MAX_DESC,
	MAX_LONG_TEXT,
	MAX_CODE,
	MAX_ARRAY,
} from "../../../lib/validation-constants";

export const createProjectProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects",
		tags: ["Projects"],
		summary: "Create a new project",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: trimmedString(MAX_NAME),
			description: optionalTrimmed(MAX_DESC),
			type: z
				.enum([
					"RESIDENTIAL",
					"COMMERCIAL",
					"INDUSTRIAL",
					"INFRASTRUCTURE",
					"MIXED",
				])
				.optional(),
			clientName: optionalTrimmed(MAX_NAME),
			clientId: z.string().trim().max(100).optional(),
			location: optionalTrimmed(MAX_DESC),
			contractValue: financialAmount().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
			// Contract fields
			contractNo: nullishTrimmed(MAX_CODE),
			contractStatus: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"])
				.optional(),
			signedDate: z.coerce.date().nullish(),
			retentionPercent: percentage().nullish(),
			retentionCap: financialAmount().nullish(),
			retentionReleaseDays: dayCount().nullish(),
			contractNotes: nullishTrimmed(MAX_LONG_TEXT),
			// New contract fields
			includesVat: z.boolean().optional(),
			vatPercent: percentage().nullish(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			performanceBondPercent: percentage().nullish(),
			performanceBondAmount: financialAmount().nullish(),
			insuranceRequired: z.boolean().optional(),
			insuranceDetails: nullishTrimmed(MAX_LONG_TEXT),
			scopeOfWork: nullishTrimmed(MAX_LONG_TEXT),
			penaltyPercent: percentage().nullish(),
			penaltyCapPercent: percentage().nullish(),
			// Payment terms
			paymentTerms: z
				.array(
					z.object({
						type: z.enum([
							"ADVANCE",
							"MILESTONE",
							"MONTHLY",
							"COMPLETION",
							"CUSTOM",
						]),
						label: nullishTrimmed(MAX_NAME),
						percent: percentage().nullish(),
						amount: financialAmount().nullish(),
						sortOrder: z.number().int().min(0).max(999).optional(),
					}),
				)
				.max(MAX_ARRAY)
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to create projects
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "create" },
		);

		// Feature gate: check project creation limit
		await enforceFeatureAccess(input.organizationId, "projects.create", context.user);

		// Validate startDate <= endDate
		if (input.startDate && input.endDate && input.startDate > input.endDate) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
			});
		}

		const project = await createProject({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			description: input.description,
			type: input.type,
			clientName: input.clientName,
			clientId: input.clientId,
			location: input.location,
			contractValue: input.contractValue,
			startDate: input.startDate,
			endDate: input.endDate,
			// Contract fields
			contractNo: input.contractNo,
			contractStatus: input.contractStatus,
			signedDate: input.signedDate,
			retentionPercent: input.retentionPercent,
			retentionCap: input.retentionCap,
			retentionReleaseDays: input.retentionReleaseDays,
			contractNotes: input.contractNotes,
			// New fields
			includesVat: input.includesVat,
			vatPercent: input.vatPercent,
			paymentMethod: input.paymentMethod,
			performanceBondPercent: input.performanceBondPercent,
			performanceBondAmount: input.performanceBondAmount,
			insuranceRequired: input.insuranceRequired,
			insuranceDetails: input.insuranceDetails,
			scopeOfWork: input.scopeOfWork,
			penaltyPercent: input.penaltyPercent,
			penaltyCapPercent: input.penaltyCapPercent,
			paymentTerms: input.paymentTerms,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PROJECT_CREATED",
			entityType: "project",
			entityId: project.id,
			metadata: { name: input.name },
		});

		return {
			...project,
			contractValue: project.contractValue
				? Number(project.contractValue)
				: null,
			progress: Number(project.progress),
		};
	});
