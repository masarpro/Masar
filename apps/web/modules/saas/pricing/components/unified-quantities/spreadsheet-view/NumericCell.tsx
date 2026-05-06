"use client";

import { Input } from "@ui/components/input";

interface Props {
	row: number;
	col: number;
	value: string;
	onChange: (v: string) => void;
	onCommit: () => void;
	onRevert: () => void;
	onKeyDown: (
		e: React.KeyboardEvent<HTMLInputElement>,
		row: number,
		col: number,
	) => void;
	disabled?: boolean;
	error?: boolean;
	suffix?: string;
}

/**
 * Editable spreadsheet cell. Carries data attributes used by useKeyboardNav
 * to discover its position in the grid.
 */
export function NumericCell({
	row,
	col,
	value,
	onChange,
	onCommit,
	onRevert,
	onKeyDown,
	disabled,
	error,
	suffix,
}: Props) {
	return (
		<div data-cell-row={row} data-cell-col={col} className="relative">
			<Input
				type="text"
				inputMode="decimal"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onCommit}
				onFocus={(e) => e.currentTarget.select()}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						onRevert();
						(e.currentTarget as HTMLInputElement).blur();
						return;
					}
					onKeyDown(e, row, col);
				}}
				disabled={disabled}
				className={`h-8 px-2 text-end font-mono text-xs tabular-nums ${
					suffix ? "pe-7" : ""
				} ${
					error ? "border-red-400 focus-visible:ring-red-400" : ""
				}`}
				title={error ? "فشل الحفظ — تحقّق من القيمة" : undefined}
			/>
			{suffix && (
				<span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
					{suffix}
				</span>
			)}
		</div>
	);
}
