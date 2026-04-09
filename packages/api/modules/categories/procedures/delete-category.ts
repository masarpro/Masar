import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

export const deleteCategory = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/categories/{id}",
		tags: ["Categories"],
		summary:
			"Delete or deactivate a category (system → soft delete, custom → hard delete if unused)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		// IDOR protection
		const existing = await db.orgCategory.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			select: { id: true, isSystem: true, group: true },
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "الفئة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		if (existing.isSystem) {
			// Soft delete: deactivate, never remove (history depends on it)
			await db.orgCategory.update({
				where: { id: existing.id },
				data: { isActive: false },
			});
			invalidateCategoriesCache(input.organizationId, existing.group);
			return { deleted: false, deactivated: true };
		}

		// Custom category: check usage before hard-delete
		const [feUsage, ceUsage] = await Promise.all([
			db.financeExpense.count({
				where: {
					organizationId: input.organizationId,
					categoryId: existing.id,
				},
			}),
			db.companyExpense.count({
				where: {
					organizationId: input.organizationId,
					categoryId: existing.id,
				},
			}),
		]);
		const usedCount = feUsage + ceUsage;

		if (usedCount > 0) {
			throw new ORPCError("CONFLICT", {
				message: `لا يمكن حذف هذه الفئة لأنها مستخدمة في ${usedCount} مصروف. يمكنك تعطيلها بدلاً من حذفها.`,
				data: { usedCount },
			});
		}

		// Hard delete (cascade removes subcategories)
		await db.orgCategory.delete({ where: { id: existing.id } });
		invalidateCategoriesCache(input.organizationId, existing.group);
		return { deleted: true, deactivated: false };
	});
