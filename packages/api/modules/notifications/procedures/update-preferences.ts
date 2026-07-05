import { ORPCError } from "@orpc/server";
import {
	db,
	isValidPrefKey,
	type NotificationEventChannel,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const notificationChannelEnum = z.enum(["IN_APP", "EMAIL"]);

/**
 * تحديث تفضيلات الإشعارات — overrides متفرقة فوق افتراضيات السجل.
 * events: خريطة جزئية { "finance.invoiceIssued": ["IN_APP"], "chat.*": [] }
 * تُدمَج في eventPrefs المخزّنة. reset: true يمسح كل الـ overrides.
 */
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
			muteAll: z.boolean().optional(),
			emailDigest: z.boolean().optional(),
			events: z
				.record(z.string().max(100), z.array(notificationChannelEnum).max(2))
				.optional(),
			reset: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		// رفض أي مفتاح خارج السجل (مفتاح حدث أو wildcard وحدة "module.*")
		if (input.events) {
			for (const key of Object.keys(input.events)) {
				if (!isValidPrefKey(key)) {
					throw new ORPCError("BAD_REQUEST", {
						message: `مفتاح حدث غير معروف: ${key}`,
					});
				}
			}
		}

		const existing = await db.notificationPreference.findUnique({
			where: {
				userId_organizationId: {
					userId: context.user.id,
					organizationId: input.organizationId,
				},
			},
			select: { eventPrefs: true },
		});

		const storedPrefs = input.reset
			? {}
			: ((existing?.eventPrefs ?? {}) as Record<
					string,
					NotificationEventChannel[]
				>);

		const mergedEventPrefs: Record<string, NotificationEventChannel[]> = {
			...storedPrefs,
			...(input.events ?? {}),
		};

		const generalFields = {
			...(input.muteAll !== undefined ? { muteAll: input.muteAll } : {}),
			...(input.emailDigest !== undefined
				? { emailDigest: input.emailDigest }
				: {}),
			...(input.reset ? { muteAll: false } : {}),
		};

		await db.notificationPreference.upsert({
			where: {
				userId_organizationId: {
					userId: context.user.id,
					organizationId: input.organizationId,
				},
			},
			update: {
				eventPrefs: mergedEventPrefs,
				...generalFields,
			},
			create: {
				userId: context.user.id,
				organizationId: input.organizationId,
				eventPrefs: mergedEventPrefs,
				...generalFields,
			},
		});

		return { success: true };
	});
