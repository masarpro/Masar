import {
	NOTIFICATION_REGISTRY,
	db,
	resolveEventChannels,
	type NotificationEventChannel,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

/**
 * تفضيلات الإشعارات — العقد الجديد المبني على السجل.
 * يعيد خريطة قنوات مدموجة بالكامل (افتراضيات السجل + overrides المستخدم)
 * لكل حدث في السجل — الواجهة لا تحسب افتراضيات أبداً.
 */
export const getNotificationPreferencesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Get notification preferences for the current user",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
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
			select: { muteAll: true, emailDigest: true, eventPrefs: true },
		});

		const eventPrefs = (prefs?.eventPrefs ?? null) as Record<
			string,
			NotificationEventChannel[]
		> | null;

		const events: Record<string, NotificationEventChannel[]> = {};
		for (const def of NOTIFICATION_REGISTRY) {
			events[def.key] = resolveEventChannels(def, eventPrefs);
		}

		return {
			muteAll: prefs?.muteAll ?? false,
			emailDigest: prefs?.emailDigest ?? false,
			events,
		};
	});
