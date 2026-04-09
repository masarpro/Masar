import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ensureCategoriesSeeded } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

const groupEnum = z.enum(["EXPENSE"]);

export const listCategories = protectedProcedure
	.route({
		method: "GET",
		path: "/categories",
		tags: ["Categories"],
		summary: "List categories for an organization (with subcategories)",
	})
	.input(
		z.object({
			organizationId: idString(),
			group: groupEnum.optional().default("EXPENSE"),
			includeInactive: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		// Read access requires organization membership only — no specific
		// permission check, so the expense combobox works for any member.
		await verifyOrganizationAccess(input.organizationId, context.user.id);
		await ensureCategoriesSeeded(input.organizationId, input.group);

		return db.orgCategory.findMany({
			where: {
				organizationId: input.organizationId,
				group: input.group,
				...(input.includeInactive ? {} : { isActive: true }),
			},
			include: {
				subcategories: {
					where: input.includeInactive ? {} : { isActive: true },
					orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
				},
			},
			orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
		});
	});
