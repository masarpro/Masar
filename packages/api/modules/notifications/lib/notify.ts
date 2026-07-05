/**
 * المرسل المركزي للإشعارات — notifyEvent
 * ========================================
 * نقطة الدخول الوحيدة لإطلاق إشعار من أي إجراء في المنصة.
 *
 * العقد الصارم:
 *   - لا يرمي أبداً (never-throw). فشل الإشعار لا يكسر العملية الأم إطلاقاً
 *     (نفس قاعدة auto-journal). الأخطاء تُسجَّل في اللوج + Sentry فقط.
 *   - يُستدعى بـ `await notifyEvent({...})` بعد اكتمال الـ transaction وبعد
 *     orgAuditLog — بدون try/catch عند الاستدعاء وبدون .then() متداخل.
 *
 * الأنبوب:
 *   سجل الأحداث ← حل الجمهور ← استبعاد الفاعل ← بوابة الصلاحية (OWNER يمر
 *   دائماً) ← تفضيلات كل مستقبل (eventPrefs ← wildcard ← افتراضي السجل،
 *   muteAll يُسقِط) ← كتابة الصفوف (IN_APP فوراً SENT، EMAIL في طابور PENDING
 *   يفرغه cron) مع dedupeKey لكل مستخدم و skipDuplicates.
 */
import {
	NOTIFICATION_EVENT_BY_KEY,
	createNotificationRows,
	db,
	getOrganizationAdminUserIds,
	resolveEventChannels,
	type NotificationEventChannel,
	type NotificationEventData,
	type NotificationRowInput,
} from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { logBusinessEvent } from "@repo/logs";
import { getCachedUserPermissions } from "../../../lib/permissions";
import { getMembersWithPermission, getProjectMembersByRole } from "./audience";
import { getOwnerUserIds } from "./notification-permissions";

export interface NotifyEventParams {
	/** مفتاح الحدث من السجل — "finance.invoiceIssued" */
	event: string;
	organizationId: string;
	/** منفّذ العملية — يُستبعد من المستقبلين دائماً */
	actorId?: string;
	/** مطلوب لأحداث audience من نوع project-role */
	projectId?: string;
	/** الكيان المرتبط — للروابط العميقة وللـ dedupe */
	entity?: { type?: string; id: string };
	/** متغيرات قالب المحتوى (projectName, amount, ...) — تُخزَّن في metadata */
	data?: NotificationEventData;
	/** المستقبلون الصريحون — لأحداث audience من نوع explicit */
	recipients?: string[];
}

export async function notifyEvent(params: NotifyEventParams): Promise<void> {
	try {
		const def = NOTIFICATION_EVENT_BY_KEY[params.event];
		if (!def) {
			// مفتاح غير مسجّل = خطأ برمجي، لا يُرمى — يُسجَّل ويُتجاهَل
			console.error("[NOTIFY] unknown event key", { event: params.event });
			logBusinessEvent({
				type: "notification.failed",
				organizationId: params.organizationId,
				metadata: { event: params.event, reason: "unknown_event_key" },
				severity: "error",
			});
			return;
		}

		// ── 1. حل الجمهور (اتحاد كل المواصفات) ────────────────────────────
		const audienceSets = await Promise.all(
			def.audience.map((spec) => {
				switch (spec.kind) {
					case "org-permission":
						return getMembersWithPermission(
							params.organizationId,
							spec.section,
							spec.action,
						);
					case "project-role":
						return params.projectId
							? getProjectMembersByRole(params.projectId, spec.roles)
							: Promise.resolve([] as string[]);
					case "org-admins":
						return getOrganizationAdminUserIds(params.organizationId);
					case "explicit":
						return Promise.resolve(params.recipients ?? []);
					default:
						return Promise.resolve([] as string[]);
				}
			}),
		);

		let recipients = [...new Set(audienceSets.flat())].filter(
			(id) => id && id !== params.actorId,
		);
		if (recipients.length === 0) {
			return;
		}

		// ── 2. بوابة الصلاحية (OWNER يمر دائماً) ──────────────────────────
		if (def.permission) {
			const required = def.permission;
			const ownerIds = await getOwnerUserIds(params.organizationId, recipients);
			const checks = await Promise.all(
				recipients.map(async (userId) => {
					if (ownerIds.has(userId)) {
						return userId;
					}
					const permissions = await getCachedUserPermissions(
						userId,
						params.organizationId,
					);
					return hasPermission(permissions, required.section, required.action)
						? userId
						: null;
				}),
			);
			recipients = checks.filter((id): id is string => id !== null);
			if (recipients.length === 0) {
				return;
			}
		}

		// ── 3. تفضيلات المستقبلين ─────────────────────────────────────────
		const prefRows = await db.notificationPreference.findMany({
			where: {
				organizationId: params.organizationId,
				userId: { in: recipients },
			},
			select: { userId: true, muteAll: true, eventPrefs: true },
		});
		const prefMap = new Map(prefRows.map((p) => [p.userId, p]));

		// ── 4. بناء الصفوف ────────────────────────────────────────────────
		const content = def.content(params.data ?? {});
		const entityId = params.entity?.id;
		const minute = Math.floor(Date.now() / 60000);
		// metadata بدون قيم undefined (Prisma Json)
		const metadata: Record<string, unknown> = { eventKey: def.key };
		for (const [k, v] of Object.entries(params.data ?? {})) {
			if (v !== undefined) {
				metadata[k] = v;
			}
		}

		const rows: NotificationRowInput[] = [];
		for (const userId of recipients) {
			const pref = prefMap.get(userId);
			if (pref?.muteAll) {
				continue;
			}
			const channels = resolveEventChannels(
				def,
				(pref?.eventPrefs ?? null) as Record<
					string,
					NotificationEventChannel[]
				> | null,
			);
			const dedupeBase =
				def.dedupe && entityId
					? `${def.key}:${entityId}:${userId}${def.dedupe === "per-entity-minute" ? `:${minute}` : ""}`
					: undefined;

			for (const channel of channels) {
				rows.push({
					organizationId: params.organizationId,
					userId,
					type: def.key,
					title: content.title,
					body: content.body,
					projectId: params.projectId,
					entityType: params.entity?.type ?? def.entityType,
					entityId,
					channel,
					// مفتاح مستقل لكل قناة (dedupeKey فريد عالمياً)
					dedupeKey: dedupeBase
						? channel === "EMAIL"
							? `${dedupeBase}:email`
							: dedupeBase
						: undefined,
					metadata,
				});
			}
		}

		if (rows.length > 0) {
			await createNotificationRows(rows);
		}
	} catch (error) {
		// لا يصل أي خطأ للعملية الأم — تسجيل فقط
		console.error("[NOTIFY] notifyEvent failed", {
			event: params.event,
			organizationId: params.organizationId,
			error,
		});
		logBusinessEvent({
			type: "notification.failed",
			organizationId: params.organizationId,
			metadata: {
				event: params.event,
				error: error instanceof Error ? error.message : String(error),
			},
			severity: "error",
		});
	}
}
