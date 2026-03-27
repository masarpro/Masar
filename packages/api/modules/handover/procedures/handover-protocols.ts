// Handover Protocols — محاضر الاستلام والتسليم
// 15 procedures: CRUD + Items + Import + Workflow + Warranty

import { db, orgAuditLog, generateAtomicNo } from "@repo/database";
import { z } from "zod";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import { Prisma } from "@repo/database/prisma/generated/client";

// ═══ Shared enums ═══
const handoverTypeEnum = z.enum([
	"ITEM_ACCEPTANCE",
	"PRELIMINARY",
	"FINAL",
	"DELIVERY",
]);

const handoverStatusEnum = z.enum([
	"DRAFT",
	"PENDING_SIGNATURES",
	"PARTIALLY_SIGNED",
	"COMPLETED",
	"ARCHIVED",
]);

const qualityRatingEnum = z.enum([
	"EXCELLENT",
	"GOOD",
	"ACCEPTABLE",
	"NEEDS_REWORK",
	"REJECTED",
]);

const partySchema = z.object({
	name: z.string().min(1),
	role: z.string().min(1),
	organization: z.string().optional(),
	signed: z.boolean().default(false),
	signedAt: z.string().nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST HANDOVER PROTOCOLS
// ═══════════════════════════════════════════════════════════════════════════
export const listHandoverProtocols = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/protocols",
		tags: ["Handover"],
		summary: "List handover protocols",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			type: handoverTypeEnum.optional(),
			status: handoverStatusEnum.optional(),
			subcontractContractId: z.string().optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			search: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		const where: any = { organizationId: input.organizationId };
		if (input.projectId) where.projectId = input.projectId;
		if (input.type) where.type = input.type;
		if (input.status) where.status = input.status;
		if (input.subcontractContractId) where.subcontractContractId = input.subcontractContractId;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.search) {
			where.OR = [
				{ protocolNo: { contains: input.search, mode: "insensitive" } },
				{ title: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [items, total] = await Promise.all([
			db.handoverProtocol.findMany({
				where,
				include: {
					project: { select: { id: true, name: true } },
					subcontractContract: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
					_count: { select: { items: true } },
				},
				orderBy: { date: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.handoverProtocol.count({ where }),
		]);

		return { items, total };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GET HANDOVER PROTOCOL BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getHandoverProtocol = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/protocols/{id}",
		tags: ["Handover"],
		summary: "Get a single handover protocol",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			include: {
				project: { select: { id: true, name: true } },
				subcontractContract: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				createdBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (!protocol) {
			throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		}

		return protocol;
	});

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
			organizationId: z.string(),
			projectId: z.string(),
			type: handoverTypeEnum,
			date: z.coerce.date(),
			title: z.string().min(1).max(300),
			subcontractContractId: z.string().optional(),
			location: z.string().optional(),
			description: z.string().optional(),
			conditions: z.string().optional(),
			parties: z.array(partySchema).default([]),
			warrantyMonths: z.number().int().positive().optional().default(12),
			retentionReleaseAmount: z.number().nonnegative().optional(),
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
				parties: parties as any,
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
			organizationId: z.string(),
			id: z.string(),
			title: z.string().min(1).max(300).optional(),
			date: z.coerce.date().optional(),
			location: z.string().nullable().optional(),
			description: z.string().nullable().optional(),
			conditions: z.string().nullable().optional(),
			parties: z.array(partySchema).optional(),
			observations: z.any().optional(),
			exceptions: z.any().optional(),
			warrantyMonths: z.number().int().positive().optional(),
			retentionReleaseAmount: z.number().nonnegative().optional(),
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
		const updateData: any = { ...data };

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
			updateData.parties = data.parties.map((p: any) => ({
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
	.input(z.object({ organizationId: z.string(), id: z.string() }))
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

// ═══════════════════════════════════════════════════════════════════════════
// 6. ADD HANDOVER ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const addHandoverItem = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{protocolId}/items",
		tags: ["Handover"],
		summary: "Add an item to a handover protocol",
	})
	.input(
		z.object({
			organizationId: z.string(),
			protocolId: z.string(),
			description: z.string().min(1),
			unit: z.string().optional(),
			contractQty: z.number().optional(),
			executedQty: z.number().optional(),
			acceptedQty: z.number().optional(),
			qualityRating: qualityRatingEnum.optional(),
			remarks: z.string().optional(),
			subcontractItemId: z.string().optional(),
			boqItemId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.protocolId, organizationId: input.organizationId },
			select: { id: true, status: true },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["DRAFT", "PENDING_SIGNATURES"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن إضافة بنود لهذا المحضر" });
		}

		// Get next sort order
		const lastItem = await db.handoverProtocolItem.findFirst({
			where: { protocolId: input.protocolId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const item = await db.handoverProtocolItem.create({
			data: {
				protocolId: input.protocolId,
				description: input.description,
				unit: input.unit,
				contractQty: input.contractQty,
				executedQty: input.executedQty,
				acceptedQty: input.acceptedQty,
				qualityRating: input.qualityRating,
				remarks: input.remarks,
				subcontractItemId: input.subcontractItemId,
				boqItemId: input.boqItemId,
				sortOrder: (lastItem?.sortOrder ?? 0) + 1,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_ITEM_ADDED",
			entityType: "handover_protocol_item",
			entityId: item.id,
			metadata: { protocolId: input.protocolId },
		});

		return item;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 7. UPDATE HANDOVER ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const updateHandoverItem = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/handover/protocols/{protocolId}/items/{itemId}",
		tags: ["Handover"],
		summary: "Update a handover protocol item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			protocolId: z.string(),
			itemId: z.string(),
			description: z.string().min(1).optional(),
			unit: z.string().nullable().optional(),
			contractQty: z.number().nullable().optional(),
			executedQty: z.number().nullable().optional(),
			acceptedQty: z.number().nullable().optional(),
			qualityRating: qualityRatingEnum.nullable().optional(),
			remarks: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.protocolId, organizationId: input.organizationId },
			select: { id: true, status: true },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["DRAFT", "PENDING_SIGNATURES"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن تعديل بنود هذا المحضر" });
		}

		const { organizationId, protocolId, itemId, ...data } = input;

		const item = await db.handoverProtocolItem.update({
			where: { id: itemId },
			data,
		});

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "HANDOVER_ITEM_UPDATED",
			entityType: "handover_protocol_item",
			entityId: itemId,
			metadata: { protocolId },
		});

		return item;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 8. DELETE HANDOVER ITEM
// ═══════════════════════════════════════════════════════════════════════════
export const deleteHandoverItem = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/handover/protocols/{protocolId}/items/{itemId}",
		tags: ["Handover"],
		summary: "Delete a handover protocol item",
	})
	.input(z.object({ organizationId: z.string(), protocolId: z.string(), itemId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.protocolId, organizationId: input.organizationId },
			select: { id: true, status: true },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["DRAFT", "PENDING_SIGNATURES"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن حذف بنود هذا المحضر" });
		}

		await db.handoverProtocolItem.delete({ where: { id: input.itemId } });

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_ITEM_DELETED",
			entityType: "handover_protocol_item",
			entityId: input.itemId,
			metadata: { protocolId: input.protocolId },
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 9. IMPORT ITEMS FROM SUBCONTRACT
// ═══════════════════════════════════════════════════════════════════════════
export const importItemsFromContract = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{protocolId}/import-contract",
		tags: ["Handover"],
		summary: "Import items from a subcontract",
	})
	.input(z.object({ organizationId: z.string(), protocolId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.protocolId, organizationId: input.organizationId },
			select: { id: true, status: true, type: true, subcontractContractId: true },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (protocol.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "يمكن الاستيراد في المسودة فقط" });
		}
		if (!protocol.subcontractContractId) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر غير مرتبط بعقد باطن" });
		}

		const contractItems = await db.subcontractItem.findMany({
			where: { contractId: protocol.subcontractContractId },
			orderBy: { sortOrder: "asc" },
			select: { id: true, description: true, unit: true, contractQty: true, sortOrder: true },
		});

		if (contractItems.length === 0) {
			return { importedCount: 0 };
		}

		// Get current max sort order
		const lastItem = await db.handoverProtocolItem.findFirst({
			where: { protocolId: input.protocolId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});
		let nextOrder = (lastItem?.sortOrder ?? 0) + 1;

		await db.handoverProtocolItem.createMany({
			data: contractItems.map((ci) => ({
				protocolId: input.protocolId,
				subcontractItemId: ci.id,
				description: ci.description,
				unit: ci.unit,
				contractQty: ci.contractQty,
				sortOrder: nextOrder++,
			})),
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_ITEMS_IMPORTED",
			entityType: "handover_protocol",
			entityId: input.protocolId,
			metadata: { source: "subcontract", count: contractItems.length },
		});

		return { importedCount: contractItems.length };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 10. IMPORT ITEMS FROM BOQ
// ═══════════════════════════════════════════════════════════════════════════
export const importItemsFromBOQ = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{protocolId}/import-boq",
		tags: ["Handover"],
		summary: "Import items from project BOQ",
	})
	.input(z.object({ organizationId: z.string(), protocolId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.protocolId, organizationId: input.organizationId },
			select: { id: true, status: true, projectId: true },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (protocol.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "يمكن الاستيراد في المسودة فقط" });
		}

		// ProjectBOQItem has limited fields — import what's available
		const boqItems = await db.projectBOQItem.findMany({
			where: { projectId: protocol.projectId, organizationId: input.organizationId },
			orderBy: { sortOrder: "asc" },
			select: { id: true, sortOrder: true },
		});

		if (boqItems.length === 0) {
			return { importedCount: 0 };
		}

		const lastItem = await db.handoverProtocolItem.findFirst({
			where: { protocolId: input.protocolId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});
		let nextOrder = (lastItem?.sortOrder ?? 0) + 1;

		await db.handoverProtocolItem.createMany({
			data: boqItems.map((bi) => ({
				protocolId: input.protocolId,
				boqItemId: bi.id,
				description: `بند BOQ #${nextOrder}`, // BOQ items may not have a description field
				sortOrder: nextOrder++,
			})),
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_ITEMS_IMPORTED",
			entityType: "handover_protocol",
			entityId: input.protocolId,
			metadata: { source: "boq", count: boqItems.length },
		});

		return { importedCount: boqItems.length };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 11. SUBMIT HANDOVER PROTOCOL (DRAFT → PENDING_SIGNATURES)
// ═══════════════════════════════════════════════════════════════════════════
export const submitHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/submit",
		tags: ["Handover"],
		summary: "Submit protocol for signatures",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			include: { _count: { select: { items: true } } },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (protocol.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "يمكن تقديم المسودات فقط" });
		}

		// Validate: at least 1 item and 1 party
		if (protocol._count.items === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر يجب أن يحتوي على بند واحد على الأقل" });
		}
		const parties = (protocol.parties as any[]) ?? [];
		if (parties.length === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر يجب أن يحتوي على طرف واحد على الأقل" });
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: { status: "PENDING_SIGNATURES" },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_SUBMITTED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { protocolNo: protocol.protocolNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SIGN HANDOVER PROTOCOL (party by index)
// ═══════════════════════════════════════════════════════════════════════════
export const signHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/sign",
		tags: ["Handover"],
		summary: "Sign a handover protocol (by party index)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			partyIndex: z.number().int().nonnegative(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["PENDING_SIGNATURES", "PARTIALLY_SIGNED"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر ليس بحالة انتظار التوقيعات" });
		}

		const parties = (protocol.parties as any[]) ?? [];
		if (input.partyIndex >= parties.length) {
			throw new ORPCError("BAD_REQUEST", { message: "فهرس الطرف غير صحيح" });
		}
		if (parties[input.partyIndex].signed) {
			throw new ORPCError("BAD_REQUEST", { message: "هذا الطرف وقّع بالفعل" });
		}

		// Update the party signature
		parties[input.partyIndex].signed = true;
		parties[input.partyIndex].signedAt = new Date().toISOString();

		// Check if all parties signed
		const allSigned = parties.every((p: any) => p.signed);
		const newStatus = allSigned ? "COMPLETED" : "PARTIALLY_SIGNED";

		const updateData: any = {
			parties: parties as any,
			status: newStatus,
		};

		if (allSigned) {
			updateData.completedAt = new Date();
			if (protocol.type === "PRELIMINARY" && !protocol.warrantyStartDate) {
				updateData.warrantyStartDate = protocol.date;
			}
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: updateData,
		});

		// If FINAL + COMPLETED + has retention → release retention via accounting
		if (allSigned && protocol.type === "FINAL" && protocol.retentionReleaseAmount) {
			const retentionAmount = Number(protocol.retentionReleaseAmount);
			if (retentionAmount > 0) {
				try {
					const { onFinalHandoverCompleted } = await import(
						"../../../lib/accounting/auto-journal"
					);
					await onFinalHandoverCompleted(db, {
						id: protocol.id,
						organizationId: protocol.organizationId,
						protocolNo: protocol.protocolNo,
						retentionReleaseAmount: protocol.retentionReleaseAmount,
						projectId: protocol.projectId,
						date: protocol.date,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to create retention release entry:", e);
					orgAuditLog({
						organizationId: input.organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: input.id,
						metadata: { error: String(e), referenceType: "RETENTION_RELEASE" },
					});
				}
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_SIGNED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { partyIndex: input.partyIndex, newStatus, protocolNo: protocol.protocolNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 13. COMPLETE HANDOVER PROTOCOL (manual completion)
// ═══════════════════════════════════════════════════════════════════════════
export const completeHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/complete",
		tags: ["Handover"],
		summary: "Complete a handover protocol manually",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["PENDING_SIGNATURES", "PARTIALLY_SIGNED"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن إكمال هذا المحضر" });
		}

		const updateData: any = {
			status: "COMPLETED",
			completedAt: new Date(),
		};

		if (protocol.type === "PRELIMINARY" && !protocol.warrantyStartDate) {
			updateData.warrantyStartDate = protocol.date;
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: updateData,
		});

		// If FINAL + has retention → release retention
		if (protocol.type === "FINAL" && protocol.retentionReleaseAmount) {
			const retentionAmount = Number(protocol.retentionReleaseAmount);
			if (retentionAmount > 0) {
				try {
					const { onFinalHandoverCompleted } = await import(
						"../../../lib/accounting/auto-journal"
					);
					await onFinalHandoverCompleted(db, {
						id: protocol.id,
						organizationId: protocol.organizationId,
						protocolNo: protocol.protocolNo,
						retentionReleaseAmount: protocol.retentionReleaseAmount,
						projectId: protocol.projectId,
						date: protocol.date,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to create retention release entry:", e);
					orgAuditLog({
						organizationId: input.organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: input.id,
						metadata: { error: String(e), referenceType: "RETENTION_RELEASE" },
					});
				}
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_COMPLETED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { protocolNo: protocol.protocolNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 14. PRINT HANDOVER PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════
export const printHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/print",
		tags: ["Handover"],
		summary: "Record a print event",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_COMPLETED", // reuse — no dedicated print action needed
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { action: "print" },
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 15. GET WARRANTY STATUS
// ═══════════════════════════════════════════════════════════════════════════
export const getWarrantyStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/warranty-status",
		tags: ["Handover"],
		summary: "Get warranty status for protocols",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		const where: any = {
			organizationId: input.organizationId,
			type: "PRELIMINARY",
			status: "COMPLETED",
			warrantyEndDate: { not: null },
		};
		if (input.projectId) where.projectId = input.projectId;

		const protocols = await db.handoverProtocol.findMany({
			where,
			include: {
				project: { select: { id: true, name: true } },
			},
			orderBy: { warrantyEndDate: "asc" },
		});

		const now = new Date();
		return protocols.map((p) => {
			const endDate = p.warrantyEndDate!;
			const diffMs = endDate.getTime() - now.getTime();
			const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
			return {
				id: p.id,
				protocolNo: p.protocolNo,
				projectName: p.project.name,
				projectId: p.project.id,
				warrantyStartDate: p.warrantyStartDate,
				warrantyEndDate: p.warrantyEndDate,
				daysRemaining: Math.max(0, daysRemaining),
				isExpired: daysRemaining <= 0,
				status: daysRemaining <= 0 ? "EXPIRED" : daysRemaining <= 30 ? "EXPIRING_SOON" : "ACTIVE",
			};
		});
	});
