import { updateSubcontractContract, logAuditEvent, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_LONG_TEXT, MAX_ID, MAX_PHONE, MAX_EMAIL, MAX_URL,
	idString, nullishTrimmed, positiveAmount, percentage,
} from "../../../lib/validation-constants";

export const updateSubcontractProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}",
		tags: ["Subcontracts"],
		summary: "Update a subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			contractNo: z.string().trim().max(MAX_CODE).nullish(),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			contractorType: z.enum(["COMPANY", "INDIVIDUAL"]).optional(),
			companyName: nullishTrimmed(MAX_NAME),
			phone: nullishTrimmed(MAX_PHONE),
			email: z.string().trim().max(MAX_EMAIL).email().nullish().or(z.literal("")),
			taxNumber: nullishTrimmed(MAX_CODE),
			crNumber: nullishTrimmed(MAX_CODE),
			status: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"])
				.optional(),
			value: positiveAmount().optional(),
			startDate: z.coerce.date().nullish(),
			endDate: z.coerce.date().nullish(),
			signedDate: z.coerce.date().nullish(),
			scopeOfWork: nullishTrimmed(MAX_LONG_TEXT),
			notes: nullishTrimmed(MAX_DESC),
			includesVat: z.boolean().optional(),
			vatPercent: percentage().nullish(),
			retentionPercent: percentage().nullish(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.nullish(),
			attachmentUrl: nullishTrimmed(MAX_URL),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		// Validate startDate <= endDate
		if (input.startDate && input.endDate && input.startDate > input.endDate) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
			});
		} else if (input.startDate || input.endDate) {
			const existing = await db.subcontractContract.findFirst({
				where: { id: input.contractId, organizationId: input.organizationId, projectId: input.projectId },
				select: { startDate: true, endDate: true },
			});
			if (existing) {
				const startDate = input.startDate ?? existing.startDate;
				const endDate = input.endDate ?? existing.endDate;
				if (startDate && endDate && startDate > endDate) {
					throw new ORPCError("BAD_REQUEST", {
						message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
					});
				}
			}
		}

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
