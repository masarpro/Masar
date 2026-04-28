"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Copy, Trash2 } from "lucide-react";
import { DomainBadge } from "../shared/DomainBadge";
import type { QuantityItem } from "../types";

interface Props {
	items: QuantityItem[];
	costStudyId: string;
	organizationId: string;
	onUpsert: (data: any) => Promise<any>;
	onDelete: (data: any) => Promise<any>;
	onDuplicate: (data: any) => Promise<any>;
	onReorder: (data: any) => Promise<any>;
}

const fmt = (n: unknown, dp = 2) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: dp,
		maximumFractionDigits: dp,
	}).format(Number(n ?? 0));

export function ItemsList({
	items,
	organizationId,
	onDelete,
	onDuplicate,
}: Props) {
	return (
		<div className="space-y-2">
			<p className="text-xs text-muted-foreground">
				⚠️ Phase 7: سيُستبدل هذا بـ ItemCard موحَّدة فيها 4 أقسام قابلة للطي
			</p>
			{items.map((item) => (
				<Card
					key={item.id}
					className="flex items-center justify-between gap-3 p-4"
				>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<DomainBadge domain={item.domain as string} />
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{item.displayName}</p>
							<p className="text-xs text-muted-foreground tabular-nums">
								{fmt(item.effectiveQuantity, 2)} {item.unit} · تكلفة{" "}
								{fmt(item.totalCost)} ر.س · بيع {fmt(item.sellTotalAmount)} ر.س
							</p>
						</div>
					</div>
					<div className="flex flex-shrink-0 gap-1">
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								onDuplicate({ id: item.id, organizationId })
							}
							title="نسخ"
						>
							<Copy className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDelete({ id: item.id, organizationId })}
							title="حذف"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</div>
				</Card>
			))}
		</div>
	);
}
