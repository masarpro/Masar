"use client";

// TODO(cleanup): unused — remove after Phase 3 verification

import { Card } from "@ui/components/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { CostSection } from "../sections/CostSection";
import { PricingSection } from "../sections/PricingSection";
import { QuantitySection } from "../sections/QuantitySection";
import { SpecificationsSection } from "../sections/SpecificationsSection";
import {
	DEFAULT_SECTION_STATE,
	type QuantityItem,
	type SectionState,
} from "../types";
import { ItemCardHeader } from "./ItemCardHeader";

interface Props {
	item: QuantityItem;
	globalMarkupPercent: number;
	onDelete: (data: { id: string; organizationId: string }) => Promise<unknown>;
	onDuplicate: (data: {
		id: string;
		organizationId: string;
	}) => Promise<unknown>;
}

interface PersistedState {
	expanded: boolean;
	sections: SectionState;
}

const STORAGE_KEY = (id: string) => `unified-item-${id}`;

function readPersisted(id: string): PersistedState {
	if (typeof window === "undefined")
		return { expanded: false, sections: DEFAULT_SECTION_STATE };
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY(id));
		if (!raw) return { expanded: false, sections: DEFAULT_SECTION_STATE };
		const parsed = JSON.parse(raw) as Partial<PersistedState>;
		return {
			expanded: Boolean(parsed.expanded),
			sections: { ...DEFAULT_SECTION_STATE, ...(parsed.sections ?? {}) },
		};
	} catch {
		return { expanded: false, sections: DEFAULT_SECTION_STATE };
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

export function ItemCard({
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

	const setSection = (key: keyof SectionState, value: boolean) => {
		setState((prev) => ({
			...prev,
			sections: { ...prev.sections, [key]: value },
		}));
	};

	const toggle = () =>
		setState((prev) => ({ ...prev, expanded: !prev.expanded }));

	return (
		<Card className="overflow-hidden">
			<ItemCardHeader
				item={item}
				expanded={state.expanded}
				onToggle={toggle}
				onDelete={onDelete}
				onDuplicate={onDuplicate}
			/>

			{state.expanded && (
				<div className="space-y-3 border-t bg-muted/30 p-3">
					<SectionToggle
						label="📏 الكمية"
						open={state.sections.quantity}
						onChange={(v) => setSection("quantity", v)}
					>
						<QuantitySection item={item} />
					</SectionToggle>

					<SectionToggle
						label="📝 المواصفات"
						open={state.sections.specifications}
						onChange={(v) => setSection("specifications", v)}
					>
						<SpecificationsSection
							item={item}
							catalogEntry={catalogEntry}
						/>
					</SectionToggle>

					<SectionToggle
						label="💰 التكلفة"
						open={state.sections.cost}
						onChange={(v) => setSection("cost", v)}
					>
						<CostSection item={item} />
					</SectionToggle>

					<SectionToggle
						label="📊 الربح والسعر النهائي"
						open={state.sections.pricing}
						onChange={(v) => setSection("pricing", v)}
					>
						<PricingSection
							item={item}
							globalMarkupPercent={globalMarkupPercent}
						/>
					</SectionToggle>
				</div>
			)}
		</Card>
	);
}

interface SectionToggleProps {
	label: string;
	open: boolean;
	onChange: (open: boolean) => void;
	children: React.ReactNode;
}

function SectionToggle({ label, open, onChange, children }: SectionToggleProps) {
	return (
		<Collapsible open={open} onOpenChange={onChange}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent">
				<span>{label}</span>
				<ChevronDown
					className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2">{children}</CollapsibleContent>
		</Collapsible>
	);
}
