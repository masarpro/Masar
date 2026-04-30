import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { upsertOpeningSchema } from "../../schemas/context.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

export const upsertOpening = subscriptionProcedure
	.input(upsertOpeningSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		// تأكّد من وجود Context (أنشئه لو غير موجود)
		const ctx = await db.quantityItemContext.upsert({
			where: { costStudyId: input.costStudyId },
			create: {
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
			},
			update: {},
		});

		const computedArea = input.width * input.height;

		const data = {
			contextId: ctx.id,
			organizationId: input.organizationId,
			name: input.name,
			openingType: input.openingType,
			width: input.width,
			height: input.height,
			computedArea,
			count: input.count,
			isExterior: input.isExterior,
			deductFromInteriorFinishes: input.deductFromInteriorFinishes,
			spaceId: input.spaceId ?? null,
		};

		let opening;
		if (input.id) {
			const existing = await db.quantityContextOpening.findFirst({
				where: { id: input.id, organizationId: input.organizationId },
			});
			if (!existing) {
				throw new ORPCError("NOT_FOUND", { message: "الفتحة غير موجودة" });
			}
			opening = await db.quantityContextOpening.update({
				where: { id: input.id },
				data,
			});
		} else {
			opening = await db.quantityContextOpening.create({ data });
		}

		// الفتحات تُؤثّر على البنود التي deductOpenings=true.
		// إعادة الحساب الكاملة في Phase 6 (recompute-all)؛ هنا نُحدِّث الإجماليات
		// المخزَّنة فقط (الكميات لا تتغيّر إلا عند upsertItem).
		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

		return { opening, studyTotals: totals };
	});
