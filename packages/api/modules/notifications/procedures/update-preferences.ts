import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const notificationChannelEnum = z.enum(["IN_APP", "EMAIL"]);

export const updateNotificationPreferencesProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Update notification preferences",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			approvalRequested: z.array(notificationChannelEnum).optional(),
			approvalDecided: z.array(notificationChannelEnum).optional(),
			documentCreated: z.array(notificationChannelEnum).optional(),
			dailyReportCreated: z.array(notificationChannelEnum).optional(),
			issueCreated: z.array(notificationChannelEnum).optional(),
			issueCritical: z.array(notificationChannelEnum).optional(),
			expenseCreated: z.array(notificationChannelEnum).optional(),
			claimCreated: z.array(notificationChannelEnum).optional(),
			claimStatusChanged: z.array(notificationChannelEnum).optional(),
			changeOrderCreated: z.array(notificationChannelEnum).optional(),
			ownerMessage: z.array(notificationChannelEnum).optional(),
			teamMemberAdded: z.array(notificationChannelEnum).optional(),
			emailDigest: z.boolean().optional(),
			muteAll: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const { organizationId, ...data } = input;

		// Remove undefined fields
		const updateData = Object.fromEntries(
			Object.entries(data).filter(([, v]) => v !== undefined),
		);

		const prefs = await db.notificationPreference.upsert({
			where: {
				userId_organizationId: {
					userId: context.user.id,
					organizationId,
				},
			},
			update: updateData,
			create: {
				userId: context.user.id,
				organizationId,
				...updateData,
			},
		});

		return prefs;
	});
