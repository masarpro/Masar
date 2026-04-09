import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

const groupEnum = z.enum(["EXPENSE"]);
const accountCodeRegex = /^\d{4}$/;

export const createCategory = subscriptionProcedure
	.route({
		method: "POST",
		path: "/categories",
		tags: ["Categories"],
		summary: "Create a new (custom) category",
	})
	.input(
		z.object({
			organizationId: idString(),
			group: groupEnum.default("EXPENSE"),
			nameAr: z.string().trim().min(1).max(100),
			nameEn: z.string().trim().min(1).max(100),
			accountCode: z
				.string()
				.trim()
				.regex(accountCodeRegex, "كود الحساب يجب أن يكون 4 أرقام"),
			isVatExempt: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		// Compute next sortOrder = max existing + 10
		const maxSort = await db.orgCategory.aggregate({
			where: {
				organizationId: input.organizationId,
				group: input.group,
			},
			_max: { sortOrder: true },
		});
		const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 10;

		const created = await db.orgCategory.create({
			data: {
				organizationId: input.organizationId,
				group: input.group,
				systemId: null,
				nameAr: input.nameAr,
				nameEn: input.nameEn,
				accountCode: input.accountCode,
				isVatExempt: input.isVatExempt,
				isSystem: false,
				isActive: true,
				sortOrder: nextSortOrder,
				createdById: context.user.id,
			},
			include: {
				subcategories: true,
			},
		});

		invalidateCategoriesCache(input.organizationId, input.group);
		return created;
	});
