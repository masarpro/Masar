import { createProject } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const createProjectProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects",
		tags: ["Projects"],
		summary: "Create a new project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم المشروع مطلوب"),
			description: z.string().optional(),
			type: z
				.enum([
					"RESIDENTIAL",
					"COMMERCIAL",
					"INDUSTRIAL",
					"INFRASTRUCTURE",
					"MIXED",
				])
				.optional(),
			clientName: z.string().optional(),
			location: z.string().optional(),
			contractValue: z.number().min(0).optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
			// Contract fields
			contractNo: z.string().nullish(),
			contractStatus: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"])
				.optional(),
			signedDate: z.coerce.date().nullish(),
			retentionPercent: z.number().nullish(),
			retentionCap: z.number().nullish(),
			retentionReleaseDays: z.number().int().nullish(),
			contractNotes: z.string().nullish(),
			// New contract fields
			includesVat: z.boolean().optional(),
			vatPercent: z.number().min(0).max(100).nullish(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			performanceBondPercent: z.number().min(0).max(100).nullish(),
			performanceBondAmount: z.number().min(0).nullish(),
			insuranceRequired: z.boolean().optional(),
			insuranceDetails: z.string().nullish(),
			scopeOfWork: z.string().nullish(),
			penaltyPercent: z.number().min(0).max(100).nullish(),
			penaltyCapPercent: z.number().min(0).max(100).nullish(),
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
						label: z.string().nullish(),
						percent: z.number().min(0).max(100).nullish(),
						amount: z.number().min(0).nullish(),
						sortOrder: z.number().int().optional(),
					}),
				)
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

		const project = await createProject({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			description: input.description,
			type: input.type,
			clientName: input.clientName,
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

		return {
			...project,
			contractValue: project.contractValue
				? Number(project.contractValue)
				: null,
			progress: Number(project.progress),
		};
	});
