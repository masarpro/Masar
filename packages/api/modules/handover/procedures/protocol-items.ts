// Handover Protocols — Item CRUD + Import from Contract/BOQ

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	quantity,
	MAX_DESC,
	MAX_CODE,
} from "../../../lib/validation-constants";
import { qualityRatingEnum } from "./shared";

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
			organizationId: idString(),
			protocolId: idString(),
			description: trimmedString(MAX_DESC),
			unit: optionalTrimmed(MAX_CODE),
			contractQty: quantity().optional(),
			executedQty: quantity().optional(),
			acceptedQty: quantity().optional(),
			qualityRating: qualityRatingEnum.optional(),
			remarks: optionalTrimmed(MAX_DESC),
			subcontractItemId: idString().optional(),
			boqItemId: idString().optional(),
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
			organizationId: idString(),
			protocolId: idString(),
			itemId: idString(),
			description: trimmedString(MAX_DESC).optional(),
			unit: z.string().trim().max(MAX_CODE).nullable().optional(),
			contractQty: quantity().nullable().optional(),
			executedQty: quantity().nullable().optional(),
			acceptedQty: quantity().nullable().optional(),
			qualityRating: qualityRatingEnum.nullable().optional(),
			remarks: nullishTrimmed(MAX_DESC),
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
	.input(z.object({ organizationId: idString(), protocolId: idString(), itemId: idString() }))
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
	.input(z.object({ organizationId: idString(), protocolId: idString() }))
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
	.input(z.object({ organizationId: idString(), protocolId: idString() }))
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
