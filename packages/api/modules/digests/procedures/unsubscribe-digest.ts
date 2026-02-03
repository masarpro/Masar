import { unsubscribeFromDigest } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const unsubscribeDigest = protectedProcedure
	.route({
		method: "POST",
		path: "/digests/unsubscribe",
		tags: ["Digests"],
		summary: "Unsubscribe from digest notifications",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		await unsubscribeFromDigest({
			organizationId: input.organizationId,
			userId: context.user.id,
			projectId: input.projectId,
		});

		return {
			success: true,
		};
	});
