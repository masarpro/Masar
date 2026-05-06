"use client";

import { useCallback } from "react";

// Editable cells carry data attributes so we can find neighbours via
// `document.querySelector` without threading refs through every row.
//   data-cell-row="<rowIndex>"
//   data-cell-col="<colIndex>"   (0..editableColCount-1)
const SELECTOR = (row: number, col: number) =>
	`[data-cell-row="${row}"][data-cell-col="${col}"] input`;

function focusCell(row: number, col: number) {
	const el = document.querySelector(SELECTOR(row, col)) as
		| HTMLInputElement
		| null;
	if (el) {
		el.focus();
		el.select();
	}
}

interface Options {
	rowCount: number;
	editableColCount: number;
}

/**
 * Spreadsheet keyboard navigation.
 *
 * - Tab / Shift+Tab: native browser behaviour (works because cells are in
 *   source order). At the end of a row, falls back to the next row's first
 *   editable cell.
 * - Enter: jump to the same column on the next row (Excel-style).
 * - Escape: handled per-cell (revert local + blur). The hook just ignores it.
 */
export function useKeyboardNav({ rowCount, editableColCount }: Options) {
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
			if (e.key === "Enter") {
				e.preventDefault();
				const nextRow = Math.min(row + 1, rowCount - 1);
				if (nextRow !== row) focusCell(nextRow, col);
				else (e.currentTarget as HTMLInputElement).blur();
				return;
			}

			if (e.key === "Tab") {
				// Let the browser handle the common case. Only intercept the wrap
				// transitions between rows so navigation feels continuous.
				if (!e.shiftKey && col === editableColCount - 1) {
					if (row < rowCount - 1) {
						e.preventDefault();
						focusCell(row + 1, 0);
					}
					return;
				}
				if (e.shiftKey && col === 0) {
					if (row > 0) {
						e.preventDefault();
						focusCell(row - 1, editableColCount - 1);
					}
					return;
				}
			}
		},
		[rowCount, editableColCount],
	);

	return { handleKeyDown };
}
