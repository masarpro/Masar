import { updateSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontractProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}",
		tags: ["Subcontracts"],
		summary: "Update a subcontract contract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			contractNo: z.string().nullish(),
			name: z.string().min(1).optional(),
			contractorType: z.enum(["COMPANY", "INDIVIDUAL"]).optional(),
			companyName: z.string().nullish(),
			phone: z.string().nullish(),
			email: z.string().email().nullish().or(z.literal("")),
			taxNumber: z.string().nullish(),
			crNumber: z.string().nullish(),
			status: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"])
				.optional(),
			value: z.number().positive().optional(),
			startDate: z.coerce.date().nullish(),
			endDate: z.coerce.date().nullish(),
			signedDate: z.coerce.date().nullish(),
			scopeOfWork: z.string().nullish(),
			notes: z.string().nullish(),
			includesVat: z.boolean().optional(),
			vatPercent: z.number().min(0).max(100).nullish(),
			retentionPercent: z.number().min(0).max(100).nullish(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			attachmentUrl: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { organizationId, projectId, contractId, ...data } = input;

		const contract = await updateSubcontractContract(
			contractId,
			organizationId,
			projectId,
			{
				...data,
				email: data.email || null,
			},
		);

		logAuditEvent(organizationId, projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_UPDATED",
			entityType: "subcontract",
			entityId: contractId,
			metadata: { name: contract.name },
		}).catch(() => {});

		return {
			...contract,
			value: Number(contract.value),
		};
	});
