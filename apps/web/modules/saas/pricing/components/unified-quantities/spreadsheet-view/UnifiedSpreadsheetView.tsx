"use client";

import { useCallback } from "react";
import type { QuantityItem } from "../types";
import { SpreadsheetRow } from "./SpreadsheetRow";
import { useKeyboardNav } from "./useKeyboardNav";

const EDITABLE_COL_COUNT = 4; // المساحة | الهدر | تكلفة/وحدة | سعر/وحدة

interface Props {
	items: QuantityItem[];
	onOpenDetail: (itemId: string) => void;
}

export function UnifiedSpreadsheetView({ items, onOpenDetail }: Props) {
	const { handleKeyDown } = useKeyboardNav({
		rowCount: items.length,
		editableColCount: EDITABLE_COL_COUNT,
	});

	// Stable callback so the memoised rows don't re-render on every parent
	// render.
	const onRowKeyDown = useCallback(handleKeyDown, [handleKeyDown]);

	if (items.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
				لا توجد بنود تطابق التصفية الحالية. أزل التصفية أو أضف بنداً جديداً.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border bg-background">
			<table className="w-full border-collapse text-sm" dir="rtl">
				<thead className="sticky top-0 z-10 border-b bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
					<tr className="text-xs font-medium text-muted-foreground">
						<th className="min-w-[180px] px-2 py-2 text-start">البند</th>
						<th className="min-w-[80px] px-2 py-2 text-center">الدور</th>
						<th className="min-w-[110px] px-1 py-2 text-end">المساحة</th>
						<th className="min-w-[80px] px-1 py-2 text-end">الهدر</th>
						<th className="min-w-[110px] px-1 py-2 text-end">
							تكلفة/وحدة
						</th>
						<th className="min-w-[110px] px-1 py-2 text-end">
							سعر/وحدة
						</th>
						<th className="min-w-[110px] px-2 py-2 text-end">الإجمالي</th>
						<th className="min-w-[100px] px-2 py-2 text-end">الربح</th>
						<th className="w-12 px-2 py-2 text-center">
							<span className="sr-only">إجراءات</span>⚙️
						</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => (
						<SpreadsheetRow
							key={item.id}
							item={item}
							rowIndex={index}
							editableColCount={EDITABLE_COL_COUNT}
							onOpenDetail={onOpenDetail}
							onKeyDown={onRowKeyDown}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
