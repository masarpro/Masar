import {
	appendContractPaymentTermsFromExecution,
	getProjectContract,
	logAuditEvent,
} from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const copyTermsFromExecutionProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/payments/copy-terms-from-execution",
		tags: ["Project Payments"],
		summary: "Create contract payment terms from execution milestones",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			taxInclusive: z.boolean(),
			items: z
				.array(
					z.object({
						milestoneId: z.string().trim().max(100),
						label: z.string().trim().min(1).max(200),
						dueDate: z.coerce.date().optional(),
						amount: z
							.number()
							.positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
					}),
				)
				.min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const contract = await getProjectContract(
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "العقد غير موجود — أنشئ عقد المشروع أولاً",
			});
		}

		// VAT: when amounts are tax-exclusive, gross-up by the contract VAT rate
		// (default 15% KSA) so the stored term amount is the final payable value.
		const vatRate = contract.vatPercent ?? 15;
		const grossUp = (amount: number) =>
			input.taxInclusive
				? amount
				: Math.round(amount * (1 + vatRate / 100) * 100) / 100;

		const { createdCount } = await appendContractPaymentTermsFromExecution(
			contract.id,
			input.items.map((item) => ({
				label: item.label,
				amount: grossUp(item.amount),
				dueDate: item.dueDate ?? null,
				milestoneId: item.milestoneId,
			})),
		);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "CONTRACT_UPDATED",
			entityType: "contract_payment_term",
			entityId: contract.id,
			metadata: {
				source: "execution_milestones",
				createdCount,
				taxInclusive: input.taxInclusive,
				vatRate,
			},
		}).catch(() => {});

		return { createdCount };
	});
