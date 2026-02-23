import { setContractPaymentTerms, getProjectContract } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const setPaymentTerms = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/contract/payment-terms",
		tags: ["Project Contract"],
		summary: "Set contract payment terms (batch replace)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			terms: z.array(
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
					dueDate: z.coerce.date().nullish(),
					milestoneId: z.string().nullish(),
					sortOrder: z.number().int().optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		// Get contract to ensure it exists
		const contract = await getProjectContract(
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "العقد غير موجود",
			});
		}

		try {
			const terms = await setContractPaymentTerms(
				contract.id,
				input.terms,
			);
			// Return clean serializable objects
			return terms.map((term) => ({
				id: term.id,
				contractId: term.contractId,
				type: term.type,
				label: term.label,
				percent: term.percent,
				amount: term.amount,
				sortOrder: term.sortOrder,
			}));
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			const message =
				error instanceof Error ? error.message : "خطأ غير معروف";
			console.error("[PAYMENT_TERMS_ERROR]", message, error);
			throw new ORPCError("BAD_REQUEST", { message });
		}
	});
