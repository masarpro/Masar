import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

export const deleteSubcategory = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/categories/subcategories/{id}",
		tags: ["Categories"],
		summary:
			"Delete or deactivate a subcategory (system → soft delete, custom → hard delete if unused)",
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
		const existing = await db.orgSubcategory.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				isSystem: true,
				category: { select: { group: true } },
			},
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "الفئة الفرعية غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		if (existing.isSystem) {
			// Soft delete
			await db.orgSubcategory.update({
				where: { id: existing.id },
				data: { isActive: false },
			});
			invalidateCategoriesCache(
				input.organizationId,
				existing.category.group,
			);
			return { deleted: false, deactivated: true };
		}

		// Custom subcategory: check usage
		const [feUsage, ceUsage] = await Promise.all([
			db.financeExpense.count({
				where: {
					organizationId: input.organizationId,
					subcategoryId: existing.id,
				},
			}),
			db.companyExpense.count({
				where: {
					organizationId: input.organizationId,
					subcategoryId: existing.id,
				},
			}),
		]);
		const usedCount = feUsage + ceUsage;

		if (usedCount > 0) {
			throw new ORPCError("CONFLICT", {
				message: `لا يمكن حذف هذه الفئة الفرعية لأنها مستخدمة في ${usedCount} مصروف. يمكنك تعطيلها بدلاً من حذفها.`,
				data: { usedCount },
			});
		}

		await db.orgSubcategory.delete({ where: { id: existing.id } });
		invalidateCategoriesCache(input.organizationId, existing.category.group);
		return { deleted: true, deactivated: false };
	});
