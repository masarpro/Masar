import { protectedProcedure } from "../../../../orpc/procedures";
import { getStudyTotalsSchema } from "../../schemas/pricing.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * GET /unified-quantities/pricing/study-totals
 * يعيد الإجماليات (يُحدِّث الـ cache في DB أيضاً — مفيد بعد عمليات
 * مجمَّعة قد لا تكون استدعت aggregator).
 */
export const getStudyTotals = protectedProcedure
	.input(getStudyTotalsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);
		return { studyTotals: totals };
	});
