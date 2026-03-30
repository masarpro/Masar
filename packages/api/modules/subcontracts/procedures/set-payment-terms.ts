import { setSubcontractPaymentTerms, getSubcontractById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_FINANCIAL, MAX_ARRAY,
	idString, nullishTrimmed, percentage, financialAmount,
} from "../../../lib/validation-constants";

export const setSubcontractPaymentTermsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/payment-terms",
		tags: ["Subcontracts"],
		summary: "Set subcontract payment terms (batch replace)",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			terms: z.array(
				z.object({
					id: z.string().trim().max(100).nullish(),
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
					dueDate: z.coerce.date().nullish(),
					sortOrder: z.number().int().min(0).max(10_000).optional(),
				}),
			).max(MAX_ARRAY),
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

		// Validate payment term percentages sum to ≤ 100%
		const termsWithPercent = input.terms.filter((t) => t.percent != null);
		if (termsWithPercent.length > 0) {
			const percentSum = termsWithPercent.reduce((sum, t) => sum + (t.percent ?? 0), 0);
			if (Math.round(percentSum * 100) / 100 > 100) {
				throw new ORPCError("BAD_REQUEST", {
					message: "مجموع نسب شروط الدفع يتجاوز 100%",
				});
			}
		}

		const terms = await setSubcontractPaymentTerms(
			input.contractId,
			input.terms,
		);

		return terms.map((term) => ({
			id: term.id,
			contractId: term.contractId,
			type: term.type,
			label: term.label,
			percent: term.percent,
			amount: term.amount,
			sortOrder: term.sortOrder,
		}));
	});
