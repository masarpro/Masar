import { createSubcontractPayment, getSubcontractById, logAuditEvent, orgAuditLog, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_CODE,
	idString, nullishTrimmed, positiveAmount,
} from "../../../lib/validation-constants";
import { notifyEvent } from "../../notifications/lib/notify";

export const createSubcontractPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/payments",
		tags: ["Subcontracts"],
		summary: "Create a payment for a subcontract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			termId: z.string().trim().max(100).nullish(),
			amount: positiveAmount(),
			date: z.coerce.date(),
			sourceAccountId: z.string().trim().min(1, "يجب اختيار الحساب البنكي").max(100),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			referenceNo: nullishTrimmed(MAX_CODE),
			description: nullishTrimmed(MAX_DESC),
			notes: nullishTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

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

		let payment: Awaited<ReturnType<typeof createSubcontractPayment>>;
		try {
			payment = await createSubcontractPayment({
				organizationId: input.organizationId,
				contractId: input.contractId,
				createdById: context.user.id,
				termId: input.termId,
				amount: input.amount,
				date: input.date,
				sourceAccountId: input.sourceAccountId,
				paymentMethod: input.paymentMethod,
				referenceNo: input.referenceNo,
				description: input.description,
				notes: input.notes,
			});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CONTRACT_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", {
						message: "عقد الباطن غير موجود",
					});
				}
				if (error.message.startsWith("PAYMENT_EXCEEDS_CONTRACT:")) {
					const [, ceiling, paid, available] = error.message.split(":");
					const fmt = (v?: string) =>
						new Intl.NumberFormat("en-US").format(Number(v ?? 0));
					throw new ORPCError("BAD_REQUEST", {
						message: `مبلغ الدفعة يتجاوز المتبقي من قيمة العقد — قيمة العقد المعدّلة: ${fmt(ceiling)} ريال، المدفوع: ${fmt(paid)} ريال، المتاح: ${fmt(available)} ريال`,
					});
				}
			}
			throw error;
		}

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_PAYMENT_CREATED",
			entityType: "subcontract_payment",
			entityId: payment.id,
			metadata: {
				contractId: input.contractId,
				amount: input.amount,
				termId: input.termId,
			},
		}).catch((e) => console.error("[Subcontracts] audit log failed:", e));

		// Auto-Journal: generate accounting entry for subcontract payment
		try {
			const { onSubcontractPayment } = await import("../../../lib/accounting/auto-journal");
			const contract = await db.subcontractContract.findUnique({ where: { id: input.contractId }, select: { name: true } });
			await onSubcontractPayment(db, {
				id: payment.id,
				organizationId: input.organizationId,
				contractorName: contract?.name ?? "",
				amount: payment.amount,
				date: new Date(input.date),
				sourceAccountId: input.sourceAccountId,
				projectId: input.projectId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for subcontract payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: payment.id,
				metadata: { error: String(e), referenceType: "SUBCONTRACT_PAYMENT" },
			});
		}

		// Auto-create payment voucher for subcontract payment
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
			await db.paymentVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					subcontractPaymentId: payment.id,
					date: new Date(input.date),
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					payeeName: contract?.name ?? "مقاول باطن",
					payeeType: "SUBCONTRACTOR",
					paymentMethod: input.paymentMethod || "BANK_TRANSFER",
					sourceAccountId: input.sourceAccountId || null,
					projectId: input.projectId,
					subcontractContractId: input.contractId,
					status: "ISSUED",
					preparedById: context.user.id,
					approvedById: context.user.id,
					approvedAt: new Date(),
				},
			});
		} catch (e) {
			console.error("[PaymentVoucher] Failed to create auto voucher from subcontract payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "voucher",
				entityId: input.projectId,
				metadata: { error: String(e), type: "PAYMENT_VOUCHER_AUTO_CREATE" },
			});
		}

		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: { name: true },
		});
		await notifyEvent({
			event: "projects.subcontractPaymentCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "subcontractPayment", id: payment.id },
			data: {
				projectName: project?.name,
				subcontractorName: contract.name,
				amount: `${new Intl.NumberFormat("en-US").format(Number(payment.amount))} ر.س`,
			},
		});

		return { ...payment, amount: Number(payment.amount) };
	});
