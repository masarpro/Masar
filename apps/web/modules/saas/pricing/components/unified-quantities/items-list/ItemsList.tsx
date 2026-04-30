"use client";

import { ItemCard } from "../item-card/ItemCard";
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
	return (
		<div className="space-y-3">
			{items.map((item) => (
				<ItemCard
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
