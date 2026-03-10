import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function convertManualItem(item: Record<string, unknown>) {
	return {
		...item,
		quantity: item.quantity != null ? Number(item.quantity) : 0,
	};
}

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════

export const manualItemsList = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/manual-items",
		tags: ["Quantities", "ManualItems"],
		summary: "List manual items for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const items = await db.manualItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "asc" },
		});

		return items.map((item) => convertManualItem(item as unknown as Record<string, unknown>));
	});

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════

export const manualItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/manual-items",
		tags: ["Quantities", "ManualItems"],
		summary: "Create a manual item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			description: z.string().min(1),
			unit: z.string().min(1),
			quantity: z.number().min(0),
			section: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Verify study exists and quantities not approved
		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: { quantitiesStatus: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "الدراسة غير موجودة",
			});
		}

		if (study.quantitiesStatus === "APPROVED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن إضافة بنود بعد اعتماد الكميات",
			});
		}

		// Get max sortOrder
		const maxItem = await db.manualItem.findFirst({
			where: { costStudyId: input.studyId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const item = await db.manualItem.create({
			data: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				description: input.description,
				unit: input.unit,
				quantity: input.quantity,
				section: input.section,
				notes: input.notes,
				sortOrder: (maxItem?.sortOrder ?? 0) + 1,
			},
		});

		return convertManualItem(item as unknown as Record<string, unknown>);
	});

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════

export const manualItemUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/manual-items/{itemId}",
		tags: ["Quantities", "ManualItems"],
		summary: "Update a manual item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
			description: z.string().min(1).optional(),
			unit: z.string().min(1).optional(),
			quantity: z.number().min(0).optional(),
			section: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const existing = await db.manualItem.findFirst({
			where: {
				id: input.itemId,
				organizationId: input.organizationId,
			},
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "البند غير موجود",
			});
		}

		const { organizationId, itemId, ...data } = input;

		const item = await db.manualItem.update({
			where: { id: itemId },
			data,
		});

		return convertManualItem(item as unknown as Record<string, unknown>);
	});

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════

export const manualItemDelete = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/quantities/manual-items/{itemId}",
		tags: ["Quantities", "ManualItems"],
		summary: "Delete a manual item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const existing = await db.manualItem.findFirst({
			where: {
				id: input.itemId,
				organizationId: input.organizationId,
			},
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "البند غير موجود",
			});
		}

		await db.manualItem.delete({
			where: { id: input.itemId },
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════
// REORDER
// ═══════════════════════════════════════════════════════════════

export const manualItemReorder = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{studyId}/manual-items/reorder",
		tags: ["Quantities", "ManualItems"],
		summary: "Reorder manual items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			itemIds: z.array(z.string()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		await db.$transaction(
			input.itemIds.map((id, index) =>
				db.manualItem.update({
					where: { id },
					data: { sortOrder: index },
				}),
			),
		);

		return { success: true };
	});
