import { addSubcontractClaimPayment, logAuditEvent, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const addSubcontractClaimPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}/payments",
		tags: ["Subcontract Claims"],
		summary: "Add a payment to an approved subcontract claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
			date: z.coerce.date(),
			paymentMethod: z.enum([
				"CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER",
			]),
			sourceAccountId: z.string().nullish(),
			description: z.string().nullish(),
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
			const payment = await addSubcontractClaimPayment({
				organizationId: input.organizationId,
				claimId: input.claimId,
				createdById: context.user.id,
				amount: input.amount,
				date: input.date,
				paymentMethod: input.paymentMethod as any,
				sourceAccountId: input.sourceAccountId,
				description: input.description,
			});

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "SUBCONTRACT_CLAIM_PAYMENT_ADDED",
				entityType: "subcontract_payment",
				entityId: payment.id,
				metadata: {
					claimId: input.claimId,
					amount: input.amount,
				},
			}).catch(() => {});

			// Auto-Journal: generate accounting entry for subcontract claim payment
			try {
				const { onSubcontractPayment } = await import("../../../lib/accounting/auto-journal");
				const { Prisma } = await import("@repo/database/prisma/generated/client");
				const claim = await db.subcontractClaim.findUnique({
					where: { id: input.claimId },
					select: { contractId: true, contract: { select: { name: true, projectId: true } } },
				});
				await onSubcontractPayment(db, {
					id: payment.id,
					organizationId: input.organizationId,
					contractorName: claim?.contract?.name ?? "",
					amount: new Prisma.Decimal(payment.amount),
					date: input.date,
					sourceAccountId: input.sourceAccountId ?? "",
					projectId: claim?.contract?.projectId ?? input.projectId,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to create SubcontractClaimPayment entry:", e);
			}

			return payment;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIM_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", { message: "المستخلص غير موجود" });
				}
				if (error.message === "CLAIM_NOT_PAYABLE") {
					throw new ORPCError("BAD_REQUEST", {
						message: "لا يمكن تسجيل دفعة — المستخلص غير معتمد",
					});
				}
				if (error.message.startsWith("AMOUNT_EXCEEDS_OUTSTANDING:")) {
					const max = error.message.split(":")[1];
					throw new ORPCError("BAD_REQUEST", {
						message: `مبلغ الدفعة يتجاوز المتبقي (${max} ريال)`,
					});
				}
			}
			throw error;
		}
	});
