"use client";

import { ItemCardTabs } from "../item-card/ItemCardTabs";
import type { QuantityItem } from "../types";

interface Props {
	items: QuantityItem[];
	costStudyId: string;
	organizationId: string;
	globalMarkupPercent: number;
	onUpsert: (data: any) => Promise<any>;
	onDelete: (data: any) => Promise<any>;
	onDuplicate: (data: any) => Promise<any>;
	onReorder: (data: any) => Promise<any>;
}

export function ItemsList({
	items,
	globalMarkupPercent,
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
