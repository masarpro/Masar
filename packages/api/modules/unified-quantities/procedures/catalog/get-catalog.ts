import { db } from "@repo/database";
import { protectedProcedure } from "../../../../orpc/procedures";
import { requireStudyAccess } from "../../lib/verify-access";
import { getCatalogSchema } from "../../schemas/catalog.schema";

/**
 * GET /unified-quantities/catalog
 * يجلب بنود الكتالوج من item_catalog_entries (يقرأ من DB، يدعم فلترة).
 */
export const getCatalog = protectedProcedure
	.input(getCatalogSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);

		const entries = await db.itemCatalogEntry.findMany({
			where: {
				isActive: true,
				...(input.domain ? { domain: input.domain } : {}),
				...(input.categoryKey ? { categoryKey: input.categoryKey } : {}),
				...(input.search
					? {
							OR: [
								{ nameAr: { contains: input.search, mode: "insensitive" } },
								{ nameEn: { contains: input.search, mode: "insensitive" } },
								{ itemKey: { contains: input.search } },
							],
						}
					: {}),
			},
			orderBy: [{ domain: "asc" }, { displayOrder: "asc" }, { nameAr: "asc" }],
		});

		return { entries, count: entries.length };
	});
