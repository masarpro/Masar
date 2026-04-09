import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { EXPENSE_CATEGORIES } from "@repo/utils";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

export const resetCategory = subscriptionProcedure
	.route({
		method: "POST",
		path: "/categories/{id}/reset",
		tags: ["Categories"],
		summary:
			"Restore a system category to its default values (nameAr/nameEn/accountCode/isVatExempt/sortOrder)",
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
			select: {
				id: true,
				isSystem: true,
				systemId: true,
				group: true,
			},
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "الفئة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		if (!existing.isSystem || !existing.systemId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن استرجاع القيم الافتراضية لفئة مخصصة",
			});
		}

		if (existing.group !== "EXPENSE") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا توجد قيم افتراضية لهذه المجموعة",
			});
		}

		// Find the default entry by systemId
		const defaultIdx = EXPENSE_CATEGORIES.findIndex(
			(c) => c.id === existing.systemId,
		);
		if (defaultIdx === -1) {
			throw new ORPCError("NOT_FOUND", {
				message: "لم يتم العثور على القيم الافتراضية لهذه الفئة",
			});
		}
		const defaults = EXPENSE_CATEGORIES[defaultIdx]!;

		// Reset name, accountCode, isVatExempt, sortOrder. Preserve isActive.
		const updated = await db.orgCategory.update({
			where: { id: existing.id },
			data: {
				nameAr: defaults.nameAr,
				nameEn: defaults.nameEn,
				accountCode: defaults.accountCode,
				isVatExempt: defaults.isVatExempt,
				sortOrder: defaultIdx * 10,
			},
			include: { subcategories: true },
		});

		invalidateCategoriesCache(input.organizationId, existing.group);
		return updated;
	});
