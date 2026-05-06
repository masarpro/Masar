"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { ChartBar, FileText, Ruler, Wallet } from "lucide-react";
import { useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { CostSection } from "../sections/CostSection";
import { PricingStrip } from "../sections/PricingStrip";
import { QuantitySection } from "../sections/QuantitySection";
import { SpecificationsSection } from "../sections/SpecificationsSection";
import type { QuantityItem } from "../types";

type TabKey = "quantity" | "specs" | "cost" | "pricing";

interface Props {
	item: QuantityItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	globalMarkupPercent: number;
}

/**
 * Renders the same four section components used by ItemCardTabs (quantity,
 * specs, cost, pricing) inside a dialog so users can fine-tune a single row
 * from the spreadsheet view without switching to cards mode.
 */
export function ItemDetailDialog({
	item,
	open,
	onOpenChange,
	globalMarkupPercent,
}: Props) {
	const [tab, setTab] = useState<TabKey>("quantity");
	const { entries } = useCatalog(item?.organizationId ?? "");
	const catalogEntry =
		(item && entries.find((e) => e.itemKey === item.catalogItemKey)) || null;

	if (!item) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-3xl"
				dir="rtl"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle className="text-base">
						{item.displayName}
					</DialogTitle>
				</DialogHeader>

				<Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
					<TabsList className="w-full justify-start gap-1 bg-transparent p-0">
						<TabsTrigger value="quantity" className="gap-1.5 text-xs">
							<Ruler className="h-3.5 w-3.5" />
							الكمية
						</TabsTrigger>
						<TabsTrigger value="specs" className="gap-1.5 text-xs">
							<FileText className="h-3.5 w-3.5" />
							المواصفات
						</TabsTrigger>
						<TabsTrigger value="cost" className="gap-1.5 text-xs">
							<Wallet className="h-3.5 w-3.5" />
							التكلفة
						</TabsTrigger>
						<TabsTrigger value="pricing" className="gap-1.5 text-xs">
							<ChartBar className="h-3.5 w-3.5" />
							التسعير
						</TabsTrigger>
					</TabsList>

					<TabsContent value="quantity" className="mt-3">
						<QuantitySection item={item} />
					</TabsContent>
					<TabsContent value="specs" className="mt-3">
						<SpecificationsSection
							item={item}
							catalogEntry={catalogEntry}
						/>
					</TabsContent>
					<TabsContent value="cost" className="mt-3">
						<CostSection item={item} />
					</TabsContent>
					<TabsContent value="pricing" className="mt-3">
						<PricingStrip
							item={item}
							globalMarkupPercent={globalMarkupPercent}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
