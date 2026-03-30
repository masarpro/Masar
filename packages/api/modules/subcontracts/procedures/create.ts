import { createSubcontractContract, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_LONG_TEXT, MAX_ID, MAX_PHONE, MAX_EMAIL, MAX_URL,
	idString, nullishTrimmed, positiveAmount, percentage,
} from "../../../lib/validation-constants";

export const createSubcontractProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts",
		tags: ["Subcontracts"],
		summary: "Create a new subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractNo: z.string().trim().max(MAX_CODE).nullish(),
			name: z.string().trim().min(1, "اسم المقاول مطلوب").max(MAX_NAME),
			contractorType: z.enum(["COMPANY", "INDIVIDUAL"]).optional(),
			companyName: nullishTrimmed(MAX_NAME),
			phone: nullishTrimmed(MAX_PHONE),
			email: z.string().trim().max(MAX_EMAIL).email().nullish().or(z.literal("")),
			taxNumber: nullishTrimmed(MAX_CODE),
			crNumber: nullishTrimmed(MAX_CODE),
			status: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"])
				.optional(),
			value: positiveAmount(),
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
		}

		const contract = await createSubcontractContract({
			organizationId: input.organizationId,
			projectId: input.projectId,
			createdById: context.user.id,
			contractNo: input.contractNo,
			name: input.name,
			contractorType: input.contractorType,
			companyName: input.companyName,
			phone: input.phone,
			email: input.email || null,
			taxNumber: input.taxNumber,
			crNumber: input.crNumber,
			status: input.status,
			value: input.value,
			startDate: input.startDate,
			endDate: input.endDate,
			signedDate: input.signedDate,
			scopeOfWork: input.scopeOfWork,
			notes: input.notes,
			includesVat: input.includesVat,
			vatPercent: input.vatPercent,
			retentionPercent: input.retentionPercent,
			paymentMethod: input.paymentMethod,
			attachmentUrl: input.attachmentUrl,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CREATED",
			entityType: "subcontract",
			entityId: contract.id,
			metadata: { name: input.name, value: input.value },
		}).catch(() => {});

		return {
			...contract,
			value: Number(contract.value),
		};
	});
