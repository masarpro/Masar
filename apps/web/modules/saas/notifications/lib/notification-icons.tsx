/**
 * أيقونات الإشعارات — أيقونة lucide لكل وحدة من سجل الإشعارات.
 * ⚠️ الاستيراد من المسار العميق فقط — ليس من جذر @repo/database.
 */
import {
	NOTIFICATION_EVENT_BY_KEY,
	NOTIFICATION_REGISTRY,
	type NotificationModuleKey,
} from "@repo/database/prisma/notification-registry";
import type { LucideIcon } from "lucide-react";
import {
	Bell,
	Building2,
	Calculator,
	FileText,
	HardHat,
	MessageSquare,
	Users,
	Wallet,
} from "lucide-react";

const MODULE_ICONS: Record<NotificationModuleKey, LucideIcon> = {
	finance: Wallet,
	projects: HardHat,
	documents: FileText,
	hr: Users,
	pricing: Calculator,
	chat: MessageSquare,
	org: Building2,
	system: Bell,
};

/** خريطة الأنواع القديمة → وحدتها (مشتقة من legacyTypes في السجل) */
const LEGACY_TYPE_TO_MODULE: Record<string, NotificationModuleKey> = {};
for (const def of NOTIFICATION_REGISTRY) {
	for (const legacyType of def.legacyTypes ?? []) {
		LEGACY_TYPE_TO_MODULE[legacyType] = def.module;
	}
}

export function getModuleIcon(module: NotificationModuleKey): LucideIcon {
	return MODULE_ICONS[module] ?? Bell;
}

/** أيقونة حدث من نوعه المخزّن (مفتاح سجل أو enum قديم) */
export function getEventIcon(type: string): LucideIcon {
	const def = NOTIFICATION_EVENT_BY_KEY[type];
	if (def) {
		return getModuleIcon(def.module);
	}
	const legacyModule = LEGACY_TYPE_TO_MODULE[type];
	if (legacyModule) {
		return getModuleIcon(legacyModule);
	}
	return Bell;
}
