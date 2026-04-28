import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { updateStudySettingsSchema } from "../../schemas/pricing.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * POST /unified-quantities/settings/update
 * يُحدّث إعدادات الدراسة (VAT, etc.) ويُعيد حساب الإجماليات.
 */
export const updateStudySettings = subscriptionProcedure
	.input(updateStudySettingsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const updated = await db.costStudy.update({
			where: { id: input.costStudyId },
			data: {
				vatPercent: input.vatPercent ?? undefined,
				vatIncludedInPrices: input.vatIncludedInPrices ?? undefined,
				globalMarkupMethod: input.globalMarkupMethod ?? undefined,
			},
		});

		// VAT يُؤثّر على الإجماليات (vat split) — أعد الحساب
		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

		return { study: updated, studyTotals: totals };
	});
