import { createSubcontractClaim, getSubcontractById, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createSubcontractClaimProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/claims",
		tags: ["Subcontract Claims"],
		summary: "Create a new subcontract claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			title: z.string().min(1, "عنوان المستخلص مطلوب"),
			periodStart: z.coerce.date(),
			periodEnd: z.coerce.date(),
			claimType: z
				.enum(["INTERIM", "FINAL", "RETENTION"])
				.default("INTERIM"),
			notes: z.string().nullish(),
			penaltyAmount: z.union([z.string(), z.number()]).optional().default(0),
			otherDeductions: z.union([z.string(), z.number()]).optional().default(0),
			otherDeductionsNote: z.string().nullish(),
			items: z.array(
				z.object({
					contractItemId: z.string(),
					thisQty: z.number().min(0),
				}),
			).min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		// Verify contract exists
		const contract = await getSubcontractById(
			input.contractId,
			input.organizationId,
			input.projectId,
		);
		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

		try {
			const claim = await createSubcontractClaim({
				organizationId: input.organizationId,
				contractId: input.contractId,
				createdById: context.user.id,
				title: input.title,
				periodStart: input.periodStart,
				periodEnd: input.periodEnd,
				claimType: input.claimType,
				notes: input.notes,
				penaltyAmount: Number(input.penaltyAmount),
				otherDeductions: Number(input.otherDeductions),
				otherDeductionsNote: input.otherDeductionsNote,
				items: input.items,
			});

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "SUBCONTRACT_CLAIM_CREATED",
				entityType: "subcontract_claim",
				entityId: claim.id,
				metadata: {
					contractId: input.contractId,
					claimNo: claim.claimNo,
					grossAmount: Number(claim.grossAmount),
				},
			}).catch(() => {});

			return {
				...claim,
				grossAmount: Number(claim.grossAmount),
				retentionAmount: Number(claim.retentionAmount),
				advanceDeduction: Number(claim.advanceDeduction),
				vatAmount: Number(claim.vatAmount),
				netAmount: Number(claim.netAmount),
				paidAmount: Number(claim.paidAmount),
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "PENDING_CLAIM_EXISTS") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يوجد مستخلص بانتظار الاعتماد — اعتمده أو ارفضه أولاً",
					});
				}
				if (error.message === "NO_ITEMS_ADDED") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يجب إضافة كميات لبند واحد على الأقل",
					});
				}
				if (error.message.startsWith("QTY_EXCEEDS_REMAINING:")) {
					throw new ORPCError("BAD_REQUEST", {
						message: "الكمية المدخلة تتجاوز المتبقي من كمية العقد",
					});
				}
				if (error.message === "NET_AMOUNT_NEGATIVE") {
					throw new ORPCError("BAD_REQUEST", {
						message: "صافي المستحق لا يمكن أن يكون سالباً",
					});
				}
			}
			throw error;
		}
	});
