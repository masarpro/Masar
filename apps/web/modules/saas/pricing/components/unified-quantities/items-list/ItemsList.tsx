"use client";

import { ItemCardTabs } from "../item-card/ItemCardTabs";
import { UnifiedSpreadsheetView } from "../spreadsheet-view/UnifiedSpreadsheetView";
import type { QuantityItem } from "../types";
import type { ViewMode } from "../workspace-bar/WorkspaceBar";

interface Props {
	items: QuantityItem[];
	costStudyId: string;
	organizationId: string;
	globalMarkupPercent: number;
	viewMode: ViewMode;
	onOpenDetail: (itemId: string) => void;
	onUpsert: (data: any) => Promise<any>;
	onDelete: (data: any) => Promise<any>;
	onDuplicate: (data: any) => Promise<any>;
	onReorder: (data: any) => Promise<any>;
}

export function ItemsList({
	items,
	globalMarkupPercent,
	viewMode,
	onOpenDetail,
	onDelete,
	onDuplicate,
}: Props) {
	if (items.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
				لا توجد بنود تطابق التصفية الحالية. أزل التصفية أو أضف بنداً جديداً.
			</div>
		);
	}

	if (viewMode === "spreadsheet") {
		return (
			<UnifiedSpreadsheetView items={items} onOpenDetail={onOpenDetail} />
		);
	}

	return (
		<div className="space-y-3">
			{items.map((item) => (
				<ItemCardTabs
					key={item.id}
					item={item}
					globalMarkupPercent={globalMarkupPercent}
					onDelete={onDelete}
					onDuplicate={onDuplicate}
				/>
			))}
		</div>
	);
}
