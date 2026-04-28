import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { updateContextSchema } from "../../schemas/context.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";

export const updateContext = subscriptionProcedure
	.input(updateContextSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const updateData = {
			totalFloorArea: input.totalFloorArea ?? undefined,
			totalWallArea: input.totalWallArea ?? undefined,
			totalExteriorWallArea: input.totalExteriorWallArea ?? undefined,
			totalRoofArea: input.totalRoofArea ?? undefined,
			totalPerimeter: input.totalPerimeter ?? undefined,
			averageFloorHeight: input.averageFloorHeight ?? undefined,
			hasBasement: input.hasBasement,
			hasRoof: input.hasRoof,
			hasYard: input.hasYard,
			yardArea: input.yardArea ?? undefined,
			fenceLength: input.fenceLength ?? undefined,
			generalNotes: input.generalNotes ?? undefined,
		};

		const ctx = await db.quantityItemContext.upsert({
			where: { costStudyId: input.costStudyId },
			create: {
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
				...updateData,
			},
			update: updateData,
		});

		return { context: ctx };
	});
