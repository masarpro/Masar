import { subscribeToDigest, getUserDigestSubscriptions } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const subscribeDigest = protectedProcedure
	.route({
		method: "POST",
		path: "/digests/subscribe",
		tags: ["Digests"],
		summary: "Subscribe to digest notifications",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			frequency: z.enum(["WEEKLY"]).optional().default("WEEKLY"),
			channel: z.enum(["IN_APP", "EMAIL"]).optional().default("IN_APP"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		const subscription = await subscribeToDigest({
			organizationId: input.organizationId,
			userId: context.user.id,
			projectId: input.projectId,
			frequency: input.frequency,
			channel: input.channel,
		});

		return {
			success: true,
			subscription,
		};
	});

export const listSubscriptions = protectedProcedure
	.route({
		method: "GET",
		path: "/digests/subscriptions",
		tags: ["Digests"],
		summary: "List user's digest subscriptions",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		const subscriptions = await getUserDigestSubscriptions(
			input.organizationId,
			context.user.id,
		);

		return { subscriptions };
	});
