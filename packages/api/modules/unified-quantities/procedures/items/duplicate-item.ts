import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { duplicateItemSchema } from "../../schemas/quantity-item.schema";
import { loadItem, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

export const duplicateItem = subscriptionProcedure
	.input(duplicateItemSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const source = await loadItem(input.id, input.organizationId);

		// إيجاد sortOrder لإلحاق النسخة بعد الأصل
		const next = await db.quantityItem.aggregate({
			where: {
				costStudyId: source.costStudyId,
				organizationId: source.organizationId,
			},
			_max: { sortOrder: true },
		});
		const newSort = (next._max.sortOrder ?? source.sortOrder) + 10;

		// انسخ كل الحقول ما عدا id/createdAt/updatedAt + غيّر displayName + ابطل الربط
		const {
			id: _id,
			createdAt: _ca,
			updatedAt: _ua,
			displayName,
			polygonPoints,
			...rest
		} = source;

		const copy = await db.quantityItem.create({
			data: {
				...rest,
				displayName: `${displayName} — نسخة`,
				sortOrder: newSort,
				// Prisma JSON: pass undefined to skip, or a value to set
				...(polygonPoints !== null ? { polygonPoints } : {}),
				// نتجنب نسخ الربط لمنع تأثير cascading
				linkedFromItemId: null,
				linkQuantityFormula: null,
				linkPercentValue: null,
				createdById: context.user.id,
				updatedById: null,
			},
		});

		const totals = await aggregateStudyTotals(
			source.costStudyId,
			input.organizationId,
		);

		return { item: copy, studyTotals: totals };
	});
