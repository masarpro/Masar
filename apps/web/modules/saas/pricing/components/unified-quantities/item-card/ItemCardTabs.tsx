"use client";

import { Card } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { ChartBar, FileText, Ruler, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { CostSection } from "../sections/CostSection";
import { PricingStrip } from "../sections/PricingStrip";
import { QuantitySection } from "../sections/QuantitySection";
import { SpecificationsSection } from "../sections/SpecificationsSection";
import type { QuantityItem } from "../types";
import { ItemCardCompactHeader } from "./ItemCardCompactHeader";

interface Props {
	item: QuantityItem;
	globalMarkupPercent: number;
	onDelete: (data: { id: string; organizationId: string }) => Promise<unknown>;
	onDuplicate: (data: {
		id: string;
		organizationId: string;
	}) => Promise<unknown>;
}

type TabKey = "quantity" | "specs" | "cost" | "pricing";

interface PersistedState {
	expanded: boolean;
	tab: TabKey;
}

const STORAGE_KEY = (id: string) => `unified-item-tab-${id}`;
const DEFAULT_STATE: PersistedState = { expanded: false, tab: "pricing" };

function readPersisted(id: string): PersistedState {
	if (typeof window === "undefined") return DEFAULT_STATE;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY(id));
		if (!raw) return DEFAULT_STATE;
		const parsed = JSON.parse(raw) as Partial<PersistedState>;
		return {
			expanded: Boolean(parsed.expanded),
			tab: (parsed.tab as TabKey) ?? DEFAULT_STATE.tab,
		};
	} catch {
		return DEFAULT_STATE;
	}
}

function writePersisted(id: string, state: PersistedState) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY(id), JSON.stringify(state));
	} catch {
		// ignore quota errors
	}
}

/**
 * Replaces the previous 4-Collapsible-stacked card body with a Linear-style
 * Tabs interface. Each tab maps 1:1 to one of the original sections so the
 * inner editing experience stays identical; only the chrome changes.
 */
export function ItemCardTabs({
	item,
	globalMarkupPercent,
	onDelete,
	onDuplicate,
}: Props) {
	const [state, setState] = useState<PersistedState>(() =>
		readPersisted(item.id),
	);

	const { entries } = useCatalog(item.organizationId);
	const catalogEntry =
		entries.find((e) => e.itemKey === item.catalogItemKey) ?? null;

	useEffect(() => {
		writePersisted(item.id, state);
	}, [item.id, state]);

	const toggle = () =>
		setState((prev) => ({ ...prev, expanded: !prev.expanded }));

	const setTab = (tab: TabKey) =>
		setState((prev) => ({ ...prev, tab }));

	return (
		<Card className="overflow-hidden">
			<ItemCardCompactHeader
				item={item}
				expanded={state.expanded}
				onToggle={toggle}
				onDelete={onDelete}
				onDuplicate={onDuplicate}
			/>

			{state.expanded && (
				<div className="border-t bg-muted/20 p-3">
					<Tabs
						value={state.tab}
						onValueChange={(v) => setTab(v as TabKey)}
					>
						<TabsList className="w-full justify-start gap-1 bg-transparent p-0">
							<TabTrigger value="pricing" icon={<ChartBar className="h-3.5 w-3.5" />}>
								التسعير
							</TabTrigger>
							<TabTrigger value="quantity" icon={<Ruler className="h-3.5 w-3.5" />}>
								الكمية
							</TabTrigger>
							<TabTrigger value="cost" icon={<Wallet className="h-3.5 w-3.5" />}>
								التكلفة
							</TabTrigger>
							<TabTrigger value="specs" icon={<FileText className="h-3.5 w-3.5" />}>
								المواصفات
							</TabTrigger>
						</TabsList>

						<TabsContent value="pricing" className="mt-3">
							<PricingStrip
								item={item}
								globalMarkupPercent={globalMarkupPercent}
							/>
						</TabsContent>
						<TabsContent value="quantity" className="mt-3">
							<QuantitySection item={item} />
						</TabsContent>
						<TabsContent value="cost" className="mt-3">
							<CostSection item={item} />
						</TabsContent>
						<TabsContent value="specs" className="mt-3">
							<SpecificationsSection
								item={item}
								catalogEntry={catalogEntry}
							/>
						</TabsContent>
					</Tabs>
				</div>
			)}
		</Card>
	);
}

interface TabTriggerProps {
	value: TabKey;
	icon: React.ReactNode;
	children: React.ReactNode;
}

function TabTrigger({ value, icon, children }: TabTriggerProps) {
	return (
		<TabsTrigger
			value={value}
			className="flex items-center gap-1.5 rounded-md border border-transparent bg-background px-3 py-1.5 text-xs data-[state=active]:border-border data-[state=active]:shadow-sm"
		>
			{icon}
			{children}
		</TabsTrigger>
	);
}
