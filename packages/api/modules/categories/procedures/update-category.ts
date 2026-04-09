import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

const accountCodeRegex = /^\d{4}$/;

export const updateCategory = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/categories/{id}",
		tags: ["Categories"],
		summary: "Update a category (system categories have restricted fields)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			nameAr: z.string().trim().min(1).max(100).optional(),
			nameEn: z.string().trim().min(1).max(100).optional(),
			accountCode: z
				.string()
				.trim()
				.regex(accountCodeRegex, "كود الحساب يجب أن يكون 4 أرقام")
				.optional(),
			isVatExempt: z.boolean().optional(),
			sortOrder: z.number().int().min(0).optional(),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		// IDOR protection: scope lookup by organizationId
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

		// System categories: only nameAr, nameEn, sortOrder, isVatExempt, isActive allowed.
		// Custom categories: all fields allowed except group/systemId (which we never update).
		const data: Record<string, unknown> = {};
		if (input.nameAr !== undefined) data.nameAr = input.nameAr;
		if (input.nameEn !== undefined) data.nameEn = input.nameEn;
		if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
		if (input.isVatExempt !== undefined) data.isVatExempt = input.isVatExempt;
		if (input.isActive !== undefined) data.isActive = input.isActive;

		if (input.accountCode !== undefined) {
			if (existing.isSystem) {
				throw new ORPCError("FORBIDDEN", {
					message: "لا يمكن تعديل كود الحساب المحاسبي للفئات النظامية",
				});
			}
			data.accountCode = input.accountCode;
		}

		const updated = await db.orgCategory.update({
			where: { id: existing.id },
			data,
			include: { subcategories: true },
		});

		invalidateCategoriesCache(input.organizationId, existing.group);
		return updated;
	});
