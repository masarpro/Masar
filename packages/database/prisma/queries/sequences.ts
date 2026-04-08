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
 * Resync a sequence counter to match the actual max value in a table.
 *
 * Reads the highest existing number from the target column, then sets
 * the sequence counter to that value so the next call to
 * `nextSequenceValue` returns max + 1.
 *
 * @param organizationId - Organization ID
 * @param sequenceKey    - e.g. "INV-2026"
 * @param table          - DB table name, e.g. "finance_invoices"
 * @param column         - Column that stores the formatted number, e.g. "invoice_no"
 * @param prefix         - Number prefix, e.g. "INV-2026"
 */
export async function resyncSequence(
	organizationId: string,
	sequenceKey: string,
	table: string,
	column: string,
	prefix: string,
): Promise<number> {
	// Extract the max numeric suffix from existing records
	// e.g. "INV-2026-0042" → 42
	const maxResult: Array<{ max_val: number | null }> =
		await db.$queryRawUnsafe(
			`SELECT MAX(
				CAST(NULLIF(SPLIT_PART(${column}, '-', array_length(string_to_array(${column}, '-'), 1)), '') AS INTEGER)
			) as max_val
			FROM ${table}
			WHERE organization_id = $1
			  AND ${column} LIKE $2`,
			organizationId,
			`${prefix}-%`,
		);

	const maxVal = maxResult[0]?.max_val ?? 0;

	if (maxVal > 0) {
		// Set the sequence to the max value so next increment returns max + 1
		await db.$queryRawUnsafe(
			`INSERT INTO organization_sequences (id, organization_id, sequence_key, current_value, updated_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, NOW())
			 ON CONFLICT (organization_id, sequence_key)
			 DO UPDATE SET current_value = $3, updated_at = NOW()`,
			organizationId,
			sequenceKey,
			maxVal,
		);
	}

	return maxVal;
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
