import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

export const createSubcategory = subscriptionProcedure
	.route({
		method: "POST",
		path: "/categories/{categoryId}/subcategories",
		tags: ["Categories"],
		summary: "Create a new (custom) subcategory under an existing category",
	})
	.input(
		z.object({
			organizationId: idString(),
			categoryId: idString(),
			nameAr: z.string().trim().min(1).max(100),
			nameEn: z.string().trim().min(1).max(100),
			isLabor: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		// Verify the parent category belongs to this org (IDOR protection)
		const parent = await db.orgCategory.findFirst({
			where: {
				id: input.categoryId,
				organizationId: input.organizationId,
			},
			select: { id: true, group: true },
		});

		if (!parent) {
			throw new ORPCError("NOT_FOUND", {
				message: "الفئة الرئيسية غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		// Compute next sortOrder = max existing in this category + 10
		const maxSort = await db.orgSubcategory.aggregate({
			where: { categoryId: parent.id },
			_max: { sortOrder: true },
		});
		const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 10;

		const created = await db.orgSubcategory.create({
			data: {
				categoryId: parent.id,
				organizationId: input.organizationId,
				systemId: null,
				nameAr: input.nameAr,
				nameEn: input.nameEn,
				isLabor: input.isLabor,
				isSystem: false,
				isActive: true,
				sortOrder: nextSortOrder,
			},
		});

		invalidateCategoriesCache(input.organizationId, parent.group);
		return created;
	});
