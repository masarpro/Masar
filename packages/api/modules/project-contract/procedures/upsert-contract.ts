import { upsertProjectContract, auditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const upsertContract = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/contract",
		tags: ["Project Contract"],
		summary: "Create or update project contract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractNo: z.string().nullish(),
			title: z.string().nullish(),
			clientName: z.string().nullish(),
			description: z.string().nullish(),
			status: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"])
				.optional(),
			value: z.number().min(0, "قيمة العقد يجب أن تكون صفر أو أكبر"),
			currency: z.string().optional(),
			signedDate: z.coerce.date().nullish(),
			startDate: z.coerce.date().nullish(),
			endDate: z.coerce.date().nullish(),
			retentionPercent: z.number().min(0).max(100).nullish(),
			retentionCap: z.number().min(0).nullish(),
			retentionReleaseDays: z.number().int().min(0).nullish(),
			notes: z.string().nullish(),
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
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			const contract = await upsertProjectContract({
				organizationId: input.organizationId,
				projectId: input.projectId,
				createdById: context.user.id,
				contractNo: input.contractNo,
				title: input.title,
				clientName: input.clientName,
				description: input.description,
				status: input.status,
				value: input.value,
				currency: input.currency,
				signedDate: input.signedDate,
				startDate: input.startDate,
				endDate: input.endDate,
				retentionPercent: input.retentionPercent,
				retentionCap: input.retentionCap,
				retentionReleaseDays: input.retentionReleaseDays,
				notes: input.notes,
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
			});

			// Audit log (fire and forget)
			auditLog({
				organizationId: input.organizationId,
				projectId: input.projectId,
				actorId: context.user.id,
				action: "CONTRACT_UPDATED",
				entityType: "contract",
				entityId: contract.id,
				metadata: { value: input.value, status: input.status },
			}).catch(() => {});

			// Return a plain serializable object to avoid ORPC serialization issues
			return {
				id: contract.id,
				organizationId: contract.organizationId,
				projectId: contract.projectId,
				contractNo: contract.contractNo,
				title: contract.title,
				clientName: contract.clientName,
				description: contract.description,
				status: contract.status,
				value: contract.value,
				currency: contract.currency,
				signedDate: contract.signedDate
					? contract.signedDate.toISOString()
					: null,
				startDate: contract.startDate
					? contract.startDate.toISOString()
					: null,
				endDate: contract.endDate
					? contract.endDate.toISOString()
					: null,
				retentionPercent: contract.retentionPercent,
				retentionCap: contract.retentionCap,
				retentionReleaseDays: contract.retentionReleaseDays,
				notes: contract.notes,
				includesVat: contract.includesVat,
				vatPercent: contract.vatPercent,
				paymentMethod: contract.paymentMethod,
				performanceBondPercent: contract.performanceBondPercent,
				performanceBondAmount: contract.performanceBondAmount,
				insuranceRequired: contract.insuranceRequired,
				insuranceDetails: contract.insuranceDetails,
				scopeOfWork: contract.scopeOfWork,
				penaltyPercent: contract.penaltyPercent,
				penaltyCapPercent: contract.penaltyCapPercent,
				createdById: contract.createdById,
				createdAt: contract.createdAt.toISOString(),
				updatedAt: contract.updatedAt.toISOString(),
			};
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			const message =
				error instanceof Error ? error.message : "خطأ غير معروف";
			console.error("[CONTRACT_UPSERT_ERROR]", message, error);
			throw new ORPCError("BAD_REQUEST", { message });
		}
	});
