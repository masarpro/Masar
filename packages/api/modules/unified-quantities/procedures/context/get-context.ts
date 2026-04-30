import { db } from "@repo/database";
import { protectedProcedure } from "../../../../orpc/procedures";
import { getContextSchema } from "../../schemas/context.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";

export const getContext = protectedProcedure
	.input(getContextSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const ctx = await db.quantityItemContext.findUnique({
			where: { costStudyId: input.costStudyId },
			include: {
				spaces: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
				openings: { orderBy: { createdAt: "asc" } },
			},
		});

		return { context: ctx };
	});
