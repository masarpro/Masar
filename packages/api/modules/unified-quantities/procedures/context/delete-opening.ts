import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { deleteOpeningSchema } from "../../schemas/context.schema";
import { requireStudyAccess } from "../../lib/verify-access";

export const deleteOpening = subscriptionProcedure
	.input(deleteOpeningSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);

		const op = await db.quantityContextOpening.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!op) {
			throw new ORPCError("NOT_FOUND", { message: "الفتحة غير موجودة" });
		}

		await db.quantityContextOpening.delete({ where: { id: input.id } });
		return { deleted: true, id: input.id };
	});
