import { createSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createSubcontractProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts",
		tags: ["Subcontracts"],
		summary: "Create a new subcontract contract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractNo: z.string().nullish(),
			name: z.string().min(1, "اسم المقاول مطلوب"),
			contractorType: z.enum(["COMPANY", "INDIVIDUAL"]).optional(),
			companyName: z.string().nullish(),
			phone: z.string().nullish(),
			email: z.string().email().nullish().or(z.literal("")),
			taxNumber: z.string().nullish(),
			crNumber: z.string().nullish(),
			status: z
				.enum(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"])
				.optional(),
			value: z.number().positive("قيمة العقد يجب أن تكون أكبر من صفر"),
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
