import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

export const updateSubcategory = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/categories/subcategories/{id}",
		tags: ["Categories"],
		summary:
			"Update a subcategory (system subcategories have restricted fields)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			nameAr: z.string().trim().min(1).max(100).optional(),
			nameEn: z.string().trim().min(1).max(100).optional(),
			isLabor: z.boolean().optional(),
			sortOrder: z.number().int().min(0).optional(),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		// IDOR protection: subcategories carry organizationId directly
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

		// All update fields are allowed for both system and custom subcategories
		// (system subcategories don't have an accountCode to protect — only labelling
		// and ordering. The isLabor flag is editable for both since it's classification.)
		const data: Record<string, unknown> = {};
		if (input.nameAr !== undefined) data.nameAr = input.nameAr;
		if (input.nameEn !== undefined) data.nameEn = input.nameEn;
		if (input.isLabor !== undefined) data.isLabor = input.isLabor;
		if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
		if (input.isActive !== undefined) data.isActive = input.isActive;

		const updated = await db.orgSubcategory.update({
			where: { id: existing.id },
			data,
		});

		invalidateCategoriesCache(input.organizationId, existing.category.group);
		return updated;
	});
