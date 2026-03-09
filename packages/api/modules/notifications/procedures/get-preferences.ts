import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

// Default preferences when no record exists
const DEFAULT_PREFERENCES = {
	approvalRequested: ["IN_APP", "EMAIL"] as const,
	approvalDecided: ["IN_APP"] as const,
	documentCreated: ["IN_APP"] as const,
	dailyReportCreated: ["IN_APP"] as const,
	issueCreated: ["IN_APP"] as const,
	issueCritical: ["IN_APP", "EMAIL"] as const,
	expenseCreated: ["IN_APP"] as const,
	claimCreated: ["IN_APP"] as const,
	claimStatusChanged: ["IN_APP"] as const,
	changeOrderCreated: ["IN_APP"] as const,
	ownerMessage: ["IN_APP"] as const,
	teamMemberAdded: ["IN_APP"] as const,
	emailDigest: false,
	muteAll: false,
};

export const getNotificationPreferencesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Get notification preferences for the current user",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const prefs = await db.notificationPreference.findUnique({
			where: {
				userId_organizationId: {
					userId: context.user.id,
					organizationId: input.organizationId,
				},
			},
		});

		if (!prefs) {
			return {
				...DEFAULT_PREFERENCES,
				id: null,
			};
		}

		return prefs;
	});
