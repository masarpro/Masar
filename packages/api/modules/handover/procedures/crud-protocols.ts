// Handover Protocols — Create, Update, Delete

import { db, orgAuditLog, generateAtomicNo } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import { Prisma } from "@repo/database/prisma/generated/client";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	financialAmount,
	MAX_NAME,
	MAX_DESC,
	MAX_LONG_TEXT,
	MAX_ARRAY,
} from "../../../lib/validation-constants";
import { handoverTypeEnum, partySchema } from "./shared";

// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE HANDOVER PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════
export const createHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols",
		tags: ["Handover"],
		summary: "Create a new handover protocol",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			type: handoverTypeEnum,
			date: z.coerce.date(),
			title: trimmedString(MAX_NAME),
			subcontractContractId: idString().optional(),
			location: optionalTrimmed(MAX_NAME),
			description: optionalTrimmed(MAX_DESC),
			conditions: optionalTrimmed(MAX_LONG_TEXT),
			parties: z.array(partySchema).max(MAX_ARRAY).default([]),
			warrantyMonths: z.number().int().min(1).max(120).optional().default(12),
			retentionReleaseAmount: financialAmount().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		// Validate project belongs to org
		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: { id: true },
		});
		if (!project) throw new ORPCError("BAD_REQUEST", { message: "المشروع غير موجود" });

		// ITEM_ACCEPTANCE requires subcontractContractId
		if (input.type === "ITEM_ACCEPTANCE" && !input.subcontractContractId) {
			throw new ORPCError("BAD_REQUEST", { message: "محضر استلام البنود يتطلب اختيار عقد باطن" });
		}

		// Validate subcontract if provided
		if (input.subcontractContractId) {
			const contract = await db.subcontractContract.findFirst({
				where: { id: input.subcontractContractId, organizationId: input.organizationId, projectId: input.projectId },
				select: { id: true },
			});
			if (!contract) throw new ORPCError("BAD_REQUEST", { message: "عقد الباطن غير موجود" });
		}

		const protocolNo = await generateAtomicNo(input.organizationId, "HND");

		// Calculate warranty end date for PRELIMINARY
		let warrantyStartDate: Date | undefined;
		let warrantyEndDate: Date | undefined;
		if (input.type === "PRELIMINARY") {
			warrantyStartDate = input.date;
			warrantyEndDate = new Date(input.date);
			warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (input.warrantyMonths ?? 12));
		}

		// Initialize parties with signed: false
		const parties = input.parties.map((p) => ({
			...p,
			signed: false,
			signedAt: null,
		}));

		const protocol = await db.handoverProtocol.create({
			data: {
				organizationId: input.organizationId,
				protocolNo,
				type: input.type,
				projectId: input.projectId,
				subcontractContractId: input.subcontractContractId,
				date: input.date,
				location: input.location,
				title: input.title,
				description: input.description,
				conditions: input.conditions,
				parties: parties as unknown as Prisma.InputJsonValue,
				warrantyMonths: input.type === "PRELIMINARY" ? (input.warrantyMonths ?? 12) : undefined,
				warrantyStartDate,
				warrantyEndDate,
				retentionReleaseAmount: input.type === "FINAL" ? input.retentionReleaseAmount : undefined,
				status: "DRAFT",
				createdById: context.user.id,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_CREATED",
			entityType: "handover_protocol",
			entityId: protocol.id,
			metadata: { protocolNo, type: input.type, projectId: input.projectId },
		});

		return protocol;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 4. UPDATE HANDOVER PROTOCOL (DRAFT only)
// ═══════════════════════════════════════════════════════════════════════════
export const updateHandoverProtocol = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/handover/protocols/{id}",
		tags: ["Handover"],
		summary: "Update a handover protocol (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			title: trimmedString(MAX_NAME).optional(),
			date: z.coerce.date().optional(),
			location: nullishTrimmed(MAX_NAME),
			description: nullishTrimmed(MAX_DESC),
			conditions: nullishTrimmed(MAX_LONG_TEXT),
			parties: z.array(partySchema).max(MAX_ARRAY).optional(),
			observations: z.array(z.object({ text: z.string().trim().max(2000), category: z.string().trim().max(100).optional() })).max(100).optional(),
			exceptions: z.array(z.object({ text: z.string().trim().max(2000), category: z.string().trim().max(100).optional() })).max(100).optional(),
			warrantyMonths: z.number().int().min(1).max(120).optional(),
			retentionReleaseAmount: financialAmount().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const existing = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, type: true, date: true },
		});
		if (!existing) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (existing.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن تعديل محضر بعد تقديمه" });
		}

		const { organizationId, id, ...data } = input;
		const updateData: Prisma.HandoverProtocolUpdateInput = { ...data };

		// Recalculate warranty if months or date changed for PRELIMINARY
		if (existing.type === "PRELIMINARY" && (data.warrantyMonths || data.date)) {
			const effectiveDate = data.date ?? existing.date;
			const months = data.warrantyMonths ?? 12;
			updateData.warrantyStartDate = effectiveDate;
			const endDate = new Date(effectiveDate);
			endDate.setMonth(endDate.getMonth() + months);
			updateData.warrantyEndDate = endDate;
		}

		if (data.parties) {
			updateData.parties = data.parties.map((p) => ({
				...p,
				signed: false,
				signedAt: null,
			}));
		}

		const protocol = await db.handoverProtocol.update({
			where: { id },
			data: updateData,
		});

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "HANDOVER_UPDATED",
			entityType: "handover_protocol",
			entityId: id,
		});

		return protocol;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DELETE HANDOVER PROTOCOL (DRAFT only)
// ═══════════════════════════════════════════════════════════════════════════
export const deleteHandoverProtocol = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/handover/protocols/{id}",
		tags: ["Handover"],
		summary: "Delete a handover protocol (DRAFT only)",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const existing = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { id: true, status: true, protocolNo: true },
		});
		if (!existing) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (existing.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن حذف محضر بعد تقديمه" });
		}

		await db.handoverProtocol.delete({ where: { id: input.id } });

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_DELETED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { protocolNo: existing.protocolNo },
		});

		return { success: true };
	});
