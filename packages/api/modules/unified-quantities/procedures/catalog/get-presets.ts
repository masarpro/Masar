import { protectedProcedure } from "../../../../orpc/procedures";
import { requireStudyAccess } from "../../lib/verify-access";
import { getPresetsSchema } from "../../schemas/catalog.schema";
import { PRESETS } from "../../catalog";

/**
 * GET /unified-quantities/presets
 * يُرجع باقات (Presets) جاهزة من الكود (لا تُحفَظ في DB).
 */
export const getPresets = protectedProcedure
	.input(getPresetsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		return { presets: PRESETS, count: PRESETS.length };
	});
