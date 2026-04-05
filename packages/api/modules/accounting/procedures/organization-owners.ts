// Organization Owners / Partners — CRUD + ownership validation + drawings system

import {
	db,
	orgAuditLog,
	createOwnerDrawingAccount,
	ensureOwnerDrawingsSystem,
} from "@repo/database";
import { z } from "zod";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	MAX_NAME,
	MAX_DESC,
	MAX_PHONE,
	MAX_EMAIL,
} from "../../../lib/validation-constants";

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST OWNERS
// ═══════════════════════════════════════════════════════════════════════════

export const listOwnersProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owners",
		tags: ["Accounting", "Owners"],
		summary: "List organization owners/partners",
	})
	.input(
		z.object({
			organizationId: idString(),
			includeInactive: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const where: { organizationId: string; isActive?: boolean } = {
			organizationId: input.organizationId,
		};
		if (!input.includeInactive) {
			where.isActive = true;
		}

		const owners = await db.organizationOwner.findMany({
			where,
			select: {
				id: true,
				name: true,
				nameEn: true,
				ownershipPercent: true,
				nationalId: true,
				phone: true,
				email: true,
				isActive: true,
				drawingsAccountId: true,
				drawingsAccount: {
					select: {
						code: true,
						nameAr: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		return owners.map((o) => ({
			...o,
			ownershipPercent: Number(o.ownershipPercent),
		}));
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GET OWNER BY ID
// ═══════════════════════════════════════════════════════════════════════════

export const getOwnerByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owners/{id}",
		tags: ["Accounting", "Owners"],
		summary: "Get owner details with total drawings",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const owner = await db.organizationOwner.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				drawingsAccount: {
					select: {
						id: true,
						code: true,
						nameAr: true,
						nameEn: true,
					},
				},
			},
		});

		if (!owner) {
			throw new Error("Owner not found");
		}

		// Get total approved drawings
		const drawingsAggregate = await db.ownerDrawing.aggregate({
			where: {
				ownerId: input.id,
				organizationId: input.organizationId,
				status: "APPROVED",
			},
			_sum: {
				amount: true,
			},
		});

		return {
			...owner,
			ownershipPercent: Number(owner.ownershipPercent),
			totalDrawings: Number(drawingsAggregate._sum.amount ?? 0),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE OWNER
// ═══════════════════════════════════════════════════════════════════════════

export const createOwnerProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/owners",
		tags: ["Accounting", "Owners"],
		summary: "Create a new organization owner/partner",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: trimmedString(MAX_NAME),
			nameEn: optionalTrimmed(MAX_NAME),
			ownershipPercent: z.number().min(0.01).max(100),
			nationalId: optionalTrimmed(MAX_NAME),
			phone: optionalTrimmed(MAX_PHONE),
			email: optionalTrimmed(MAX_EMAIL),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Validate total ownership does not exceed 100%
		const existingSum = await db.organizationOwner.aggregate({
			where: {
				organizationId: input.organizationId,
				isActive: true,
			},
			_sum: {
				ownershipPercent: true,
			},
		});

		const currentTotal = Number(existingSum._sum.ownershipPercent ?? 0);
		if (currentTotal + input.ownershipPercent > 100) {
			throw new Error(
				`مجموع نسب الملكية سيتجاوز 100%. المجموع الحالي: ${currentTotal}%، المتاح: ${(100 - currentTotal).toFixed(2)}%`,
			);
		}

		// Create the owner record
		const owner = await db.organizationOwner.create({
			data: {
				organizationId: input.organizationId,
				name: input.name,
				nameEn: input.nameEn,
				ownershipPercent: input.ownershipPercent,
				nationalId: input.nationalId,
				phone: input.phone,
				email: input.email,
				notes: input.notes,
				createdById: context.user.id,
			},
		});

		// Create a dedicated drawings account in chart of accounts (3410, 3420, ...)
		const drawingsAccountId = await createOwnerDrawingAccount(
			db,
			input.organizationId,
			input.name,
			input.nameEn,
		);

		// Link the drawings account to the owner
		if (drawingsAccountId) {
			await db.organizationOwner.update({
				where: { id: owner.id },
				data: { drawingsAccountId },
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "OWNER_CREATED",
			entityType: "OrganizationOwner",
			entityId: owner.id,
			metadata: {
				name: input.name,
				ownershipPercent: input.ownershipPercent,
				drawingsAccountId,
			},
		});

		return {
			...owner,
			ownershipPercent: Number(owner.ownershipPercent),
			drawingsAccountId,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 4. UPDATE OWNER
// ═══════════════════════════════════════════════════════════════════════════

export const updateOwnerProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/owners/{id}/update",
		tags: ["Accounting", "Owners"],
		summary: "Update an existing owner/partner",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: optionalTrimmed(MAX_NAME),
			nameEn: optionalTrimmed(MAX_NAME),
			ownershipPercent: z.number().min(0.01).max(100).optional(),
			nationalId: optionalTrimmed(MAX_NAME),
			phone: optionalTrimmed(MAX_PHONE),
			email: optionalTrimmed(MAX_EMAIL),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Verify owner exists
		const existing = await db.organizationOwner.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: {
				id: true,
				name: true,
				ownershipPercent: true,
				drawingsAccountId: true,
			},
		});
		if (!existing) {
			throw new Error("Owner not found");
		}

		// If ownership percent is changing, validate total does not exceed 100%
		if (input.ownershipPercent !== undefined) {
			const otherOwnersSum = await db.organizationOwner.aggregate({
				where: {
					organizationId: input.organizationId,
					isActive: true,
					id: { not: input.id },
				},
				_sum: {
					ownershipPercent: true,
				},
			});

			const othersTotal = Number(otherOwnersSum._sum.ownershipPercent ?? 0);
			if (othersTotal + input.ownershipPercent > 100) {
				throw new Error(
					`مجموع نسب الملكية سيتجاوز 100%. مجموع الشركاء الآخرين: ${othersTotal}%، المتاح: ${(100 - othersTotal).toFixed(2)}%`,
				);
			}
		}

		// Build update data (only include provided fields)
		const updateData: Record<string, unknown> = {};
		if (input.name !== undefined) updateData.name = input.name;
		if (input.nameEn !== undefined) updateData.nameEn = input.nameEn;
		if (input.ownershipPercent !== undefined)
			updateData.ownershipPercent = input.ownershipPercent;
		if (input.nationalId !== undefined) updateData.nationalId = input.nationalId;
		if (input.phone !== undefined) updateData.phone = input.phone;
		if (input.email !== undefined) updateData.email = input.email;
		if (input.notes !== undefined) updateData.notes = input.notes;

		const updated = await db.organizationOwner.update({
			where: { id: input.id },
			data: updateData,
		});

		// If name changed, also update the linked ChartAccount nameAr/nameEn
		if (
			(input.name !== undefined || input.nameEn !== undefined) &&
			existing.drawingsAccountId
		) {
			const accountUpdate: Record<string, string> = {};
			if (input.name !== undefined) {
				accountUpdate.nameAr = `سحوبات ${input.name}`;
			}
			if (input.nameEn !== undefined) {
				accountUpdate.nameEn = `${input.nameEn} Drawings`;
			}
			await db.chartAccount.update({
				where: { id: existing.drawingsAccountId },
				data: accountUpdate,
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "OWNER_UPDATED",
			entityType: "OrganizationOwner",
			entityId: input.id,
			metadata: {
				changes: updateData,
			},
		});

		return {
			...updated,
			ownershipPercent: Number(updated.ownershipPercent),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DEACTIVATE OWNER
// ═══════════════════════════════════════════════════════════════════════════

export const deactivateOwnerProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/owners/{id}/deactivate",
		tags: ["Accounting", "Owners"],
		summary: "Deactivate an owner (soft delete)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Verify owner exists and is active
		const owner = await db.organizationOwner.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
				isActive: true,
			},
			select: { id: true, name: true },
		});
		if (!owner) {
			throw new Error("Owner not found or already deactivated");
		}

		// Check no active (APPROVED) drawings exist for this owner
		const activeDrawings = await db.ownerDrawing.count({
			where: {
				ownerId: input.id,
				organizationId: input.organizationId,
				status: "APPROVED",
			},
		});
		if (activeDrawings > 0) {
			throw new Error(
				`لا يمكن تعطيل الشريك — يوجد ${activeDrawings} سحوبات معتمدة يجب إلغاؤها أولاً`,
			);
		}

		await db.organizationOwner.update({
			where: { id: input.id },
			data: { isActive: false },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "OWNER_DEACTIVATED",
			entityType: "OrganizationOwner",
			entityId: input.id,
			metadata: {
				name: owner.name,
			},
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 6. GET TOTAL OWNERSHIP
// ═══════════════════════════════════════════════════════════════════════════

export const getTotalOwnershipProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/owners/total-ownership",
		tags: ["Accounting", "Owners"],
		summary: "Get total ownership percentage summary",
	})
	.input(
		z.object({
			organizationId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await db.organizationOwner.aggregate({
			where: {
				organizationId: input.organizationId,
				isActive: true,
			},
			_sum: {
				ownershipPercent: true,
			},
			_count: {
				id: true,
			},
		});

		const totalPercent = Number(result._sum.ownershipPercent ?? 0);

		return {
			totalPercent,
			remaining: Math.round((100 - totalPercent) * 100) / 100,
			ownersCount: result._count.id,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 7. ENSURE OWNER DRAWINGS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const ensureOwnerDrawingsSystemProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/accounting/owners/ensure-drawings-system",
		tags: ["Accounting", "Owners"],
		summary: "Ensure owner drawings parent account (3400) exists in chart of accounts",
	})
	.input(
		z.object({
			organizationId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await ensureOwnerDrawingsSystem(db, input.organizationId);
		return result;
	});
