"use client";

import { Loader2, Settings2, TrendingDown, TrendingUp } from "lucide-react";
import { memo } from "react";
import { DOMAIN_STYLES, type Domain, type QuantityItem } from "../types";
import { NumericCell } from "./NumericCell";
import { useEditableRow } from "./useEditableRow";

interface Props {
	item: QuantityItem;
	rowIndex: number;
	editableColCount: number;
	onOpenDetail: (itemId: string) => void;
	onKeyDown: (
		e: React.KeyboardEvent<HTMLInputElement>,
		row: number,
		col: number,
	) => void;
}

const fmt = (n: unknown, dp = 0) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: dp,
		maximumFractionDigits: dp,
	}).format(Number(n ?? 0));

const num = (v: unknown) => Number(v ?? 0);

function SpreadsheetRowImpl({
	item,
	rowIndex,
	onOpenDetail,
	onKeyDown,
}: Props) {
	const row = useEditableRow(item);

	const profit = num(item.profitAmount);
	const isProfit = profit >= 0;
	const sellTotal = num(item.sellTotalAmount);
	const domainStyle = DOMAIN_STYLES[item.domain as Domain];
	const unitLabel = item.unit?.trim() || "وحدة";
	const floor = item.contextSpaceId || item.contextScope;

	const cell = (
		col: number,
		field: "primary" | "wastage" | "cost" | "sell",
		strValue: string,
		original: number,
		buildOverride: (v: number) => Record<string, unknown>,
		suffix: string,
	) => (
		<NumericCell
			row={rowIndex}
			col={col}
			value={strValue}
			onChange={(v) => row.focus(field, v)}
			onCommit={() => row.commit(field, strValue, original, buildOverride)}
			onRevert={() => row.revert(field)}
			onKeyDown={onKeyDown}
			disabled={row.isLoading}
			error={row.errorField === field}
			suffix={suffix}
		/>
	);

	return (
		<tr className="group border-b transition hover:bg-muted/40">
			<td className="px-2 py-1.5 text-xs">
				<div className="flex items-center gap-1.5">
					<span
						className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
						style={{ backgroundColor: domainStyle?.color ?? "#999" }}
						aria-hidden="true"
					/>
					<span className="truncate" title={item.displayName}>
						{item.displayName}
					</span>
				</div>
			</td>
			<td className="px-2 py-1.5 text-center text-xs text-muted-foreground">
				{floor || "—"}
			</td>
			<td className="px-1 py-1">
				{cell(0, "primary", row.primaryStr, num(item.primaryValue), (v) => ({ primaryValue: v }), unitLabel)}
			</td>
			<td className="px-1 py-1">
				{cell(1, "wastage", row.wastageStr, num(item.wastagePercent), (v) => ({ wastagePercent: v }), "%")}
			</td>
			<td className="px-1 py-1">
				{cell(2, "cost", row.costStr, num(item.materialUnitPrice), (v) => ({ materialUnitPrice: v }), "ر.س")}
			</td>
			<td className="px-1 py-1">
				{cell(3, "sell", row.sellStr, num(item.sellUnitPrice), (v) => ({
					markupMethod: "manual_price",
					manualUnitPrice: v,
					hasCustomMarkup: true,
				}), "ر.س")}
			</td>
			<td className="px-2 py-1.5 text-end font-mono text-xs tabular-nums">
				{fmt(sellTotal)}
				<span className="ms-0.5 text-[10px] font-normal text-muted-foreground">
					ر.س
				</span>
			</td>
			<td className="px-2 py-1.5 text-end font-mono text-xs tabular-nums">
				<span
					className={`inline-flex items-center gap-0.5 font-semibold ${
						isProfit
							? "text-emerald-700 dark:text-emerald-400"
							: "text-red-700 dark:text-red-400"
					}`}
				>
					{isProfit ? (
						<TrendingUp className="h-3 w-3" />
					) : (
						<TrendingDown className="h-3 w-3" />
					)}
					{isProfit ? "+" : ""}
					{fmt(profit)}
				</span>
			</td>
			<td className="px-2 py-1.5 text-center">
				<button
					type="button"
					onClick={() => onOpenDetail(item.id)}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
					title="فتح البطاقة المفصلة"
					aria-label="فتح البطاقة المفصلة"
				>
					{row.isLoading ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Settings2 className="h-3.5 w-3.5" />
					)}
				</button>
			</td>
		</tr>
	);
}

export const SpreadsheetRow = memo(SpreadsheetRowImpl, (prev, next) => {
	const a = prev.item;
	const b = next.item;
	return (
		a.id === b.id &&
		a.displayName === b.displayName &&
		a.unit === b.unit &&
		a.contextSpaceId === b.contextSpaceId &&
		a.contextScope === b.contextScope &&
		a.primaryValue === b.primaryValue &&
		a.wastagePercent === b.wastagePercent &&
		a.materialUnitPrice === b.materialUnitPrice &&
		a.sellUnitPrice === b.sellUnitPrice &&
		a.sellTotalAmount === b.sellTotalAmount &&
		a.profitAmount === b.profitAmount &&
		prev.rowIndex === next.rowIndex &&
		prev.editableColCount === next.editableColCount &&
		prev.onOpenDetail === next.onOpenDetail &&
		prev.onKeyDown === next.onKeyDown
	);
});
