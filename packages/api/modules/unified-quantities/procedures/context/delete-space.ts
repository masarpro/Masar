import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { deleteSpaceSchema } from "../../schemas/context.schema";
import { requireStudyAccess } from "../../lib/verify-access";

export const deleteSpace = subscriptionProcedure
	.input(deleteSpaceSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);

		const space = await db.quantityContextSpace.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!space) {
			throw new ORPCError("NOT_FOUND", { message: "المساحة غير موجودة" });
		}

		await db.quantityContextSpace.delete({ where: { id: input.id } });
		return { deleted: true, id: input.id };
	});
