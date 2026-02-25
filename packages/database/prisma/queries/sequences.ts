import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Atomic Sequence Generator — مولد التسلسلات الذرية
//
// Prevents duplicate document numbers under concurrent requests.
// Uses PostgreSQL INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING
// in a single atomic SQL statement — no race conditions possible.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Atomically get the next value for a sequence.
 *
 * If the sequence doesn't exist, creates it with value 1.
 * If it exists, increments by 1 and returns the new value.
 *
 * This is a single SQL statement — fully atomic, no race condition.
 *
 * @param organizationId - Organization that owns the sequence
 * @param sequenceKey    - e.g. "INV-2026", "EXP-2026", "QT-2026"
 * @returns The next integer value (1, 2, 3, ...)
 */
export async function nextSequenceValue(
	organizationId: string,
	sequenceKey: string,
): Promise<number> {
	const result: Array<{ current_value: number }> =
		await db.$queryRawUnsafe(
			`INSERT INTO organization_sequences (id, organization_id, sequence_key, current_value, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 1, NOW())
       ON CONFLICT (organization_id, sequence_key)
       DO UPDATE SET current_value = organization_sequences.current_value + 1,
                     updated_at = NOW()
       RETURNING current_value`,
			organizationId,
			sequenceKey,
		);

	return Number(result[0].current_value);
}

/**
 * Format a sequence number with prefix and zero-padding.
 *
 * @example formatSequenceNo("INV", 2026, 42) => "INV-2026-0042"
 * @example formatSequenceNo("EXP", 2026, 7)  => "EXP-2026-0007"
 */
export function formatSequenceNo(
	prefix: string,
	year: number,
	value: number,
	pad = 4,
): string {
	return `${prefix}-${year}-${value.toString().padStart(pad, "0")}`;
}

/**
 * Generate an atomic, gapless document number.
 *
 * Combines `nextSequenceValue` + `formatSequenceNo` in one call.
 *
 * @param organizationId - Organization ID
 * @param prefix         - e.g. "INV", "EXP", "QT", "RCV", "TRF", "DOC-LET"
 * @returns Formatted number like "INV-2026-0042"
 */
export async function generateAtomicNo(
	organizationId: string,
	prefix: string,
): Promise<string> {
	const year = new Date().getFullYear();
	const sequenceKey = `${prefix}-${year}`;
	const value = await nextSequenceValue(organizationId, sequenceKey);
	return formatSequenceNo(prefix, year, value);
}
