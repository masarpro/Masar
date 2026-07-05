/**
 * تجميع الإشعارات حسب اليوم — "today" | "yesterday" | تاريخ ISO (yyyy-mm-dd).
 * دالة نقية بلا تبعيات — الترتيب يتبع ترتيب العناصر المُمرّرة.
 */

export interface NotificationDayGroup<T> {
	/** "today" | "yesterday" | تاريخ ISO مثل "2026-07-01" */
	dayKey: string;
	items: T[];
}

function toLocalDayString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function groupNotificationsByDay<T extends { createdAt: string | Date }>(
	items: T[],
): NotificationDayGroup<T>[] {
	const now = new Date();
	const todayKey = toLocalDayString(now);
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayKey = toLocalDayString(yesterday);

	const groups: NotificationDayGroup<T>[] = [];
	const byKey = new Map<string, NotificationDayGroup<T>>();

	for (const item of items) {
		const day = toLocalDayString(new Date(item.createdAt));
		const dayKey =
			day === todayKey
				? "today"
				: day === yesterdayKey
					? "yesterday"
					: day;

		let group = byKey.get(dayKey);
		if (!group) {
			group = { dayKey, items: [] };
			byKey.set(dayKey, group);
			groups.push(group);
		}
		group.items.push(item);
	}

	return groups;
}
