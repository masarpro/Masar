import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ensureCategoriesSeeded } from "../../../lib/categories/ensure-categories-seeded";
import { idString } from "../../../lib/validation-constants";

const groupEnum = z.enum(["EXPENSE"]);

export const getCategory = protectedProcedure
	.route({
		method: "GET",
		path: "/categories/{id}",
		tags: ["Categories"],
		summary: "Get a single category by id (with subcategories)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			group: groupEnum.optional().default("EXPENSE"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);
		await ensureCategoriesSeeded(input.organizationId, input.group);

		// IDOR protection: scope by organizationId, not just by id.
		const category = await db.orgCategory.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				subcategories: {
					orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
				},
			},
		});

		if (!category) {
			throw new ORPCError("NOT_FOUND", {
				message: "الفئة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		return category;
	});
