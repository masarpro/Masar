/**
 * Date helpers anchored to the app's business timezone (Asia/Riyadh, UTC+3, no DST).
 */

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Start of "today" in Riyadh, expressed as a UTC midnight Date.
 *
 * Invoice `dueDate` is a `@db.Date` (stored at 00:00 UTC with no time-of-day).
 * Comparing it to `new Date()` marks an invoice overdue from 00:00 UTC — i.e.
 * 03:00 Riyadh on the due date itself. Using this boundary with `{ lt: ... }`
 * treats an invoice as overdue only once its due date is strictly in the past
 * relative to the current calendar day in Riyadh.
 */
export function startOfTodayRiyadhUtc(now: Date = new Date()): Date {
	const riyadh = new Date(now.getTime() + RIYADH_OFFSET_MS);
	return new Date(
		Date.UTC(
			riyadh.getUTCFullYear(),
			riyadh.getUTCMonth(),
			riyadh.getUTCDate(),
		),
	);
}
