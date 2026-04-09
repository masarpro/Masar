import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { invalidateCategoriesCache } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

const groupEnum = z.enum(["EXPENSE"]);

export const reorderCategories = subscriptionProcedure
	.route({
		method: "POST",
		path: "/categories/reorder",
		tags: ["Categories"],
		summary: "Reorder a list of categories atomically",
	})
	.input(
		z.object({
			organizationId: idString(),
			group: groupEnum.default("EXPENSE"),
			items: z
				.array(
					z.object({
						id: idString(),
						sortOrder: z.number().int().min(0),
					}),
				)
				.min(1)
				.max(500),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "organization",
		});

		const ids = input.items.map((it) => it.id);

		// Verify ALL ids belong to this organization (and the requested group).
		// Catches IDOR attempts (mixing ids from another org) before any update.
		const owned = await db.orgCategory.findMany({
			where: {
				id: { in: ids },
				organizationId: input.organizationId,
				group: input.group,
			},
			select: { id: true },
		});

		if (owned.length !== ids.length) {
			throw new ORPCError("NOT_FOUND", {
				message:
					"بعض الفئات غير موجودة أو لا تنتمي لهذه المنظمة/المجموعة",
			});
		}

		// Atomic update via transaction
		await db.$transaction(
			input.items.map((it) =>
				db.orgCategory.update({
					where: { id: it.id },
					data: { sortOrder: it.sortOrder },
				}),
			),
		);

		invalidateCategoriesCache(input.organizationId, input.group);
		return { updated: input.items.length };
	});
