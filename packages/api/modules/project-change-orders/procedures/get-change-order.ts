import { ORPCError } from "@orpc/server";
import { getChangeOrder } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getChangeOrderProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-change-orders/{changeOrderId}",
		tags: ["Project Change Orders"],
		summary: "Get a single change order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			changeOrderId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const changeOrder = await getChangeOrder(
			input.organizationId,
			input.projectId,
			input.changeOrderId,
		);

		if (!changeOrder) {
			throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
		}

		return changeOrder;
	});
