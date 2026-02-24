import { setSubcontractPaymentTerms, getSubcontractById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const setSubcontractPaymentTermsProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/payment-terms",
		tags: ["Subcontracts"],
		summary: "Set subcontract payment terms (batch replace)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			terms: z.array(
				z.object({
					id: z.string().nullish(),
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
