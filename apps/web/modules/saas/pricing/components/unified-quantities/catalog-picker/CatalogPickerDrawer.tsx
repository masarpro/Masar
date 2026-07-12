"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { usePresets } from "../hooks/usePresets";
import { DOMAIN_TO_SCOPE, type Domain, type ItemCatalogEntry } from "../types";
import { CatalogCategoryTree } from "./CatalogCategoryTree";
import { CatalogSearch } from "./CatalogSearch";
import { PresetsCarousel } from "./PresetsCarousel";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "items" | "presets";
	organizationId: string;
	/** The study's workScopes — items are scope-filtered by default. */
	workScopes: string[];
	onItemSelect: (entry: ItemCatalogEntry) => Promise<void> | void;
	onPresetSelect: (presetKey: string) => Promise<void> | void;
}

/**
 * Centered modal picker — replaces the previous side Sheet so the catalog
 * appears on top of the page chrome rather than crammed against the edge.
 * Sized to be roomy on desktop (max-w-3xl, max-h-[85vh]) and full-bleed on
 * mobile.
 */
export function CatalogPickerDrawer({
	open,
	onOpenChange,
	mode,
	organizationId,
	workScopes,
	onItemSelect,
	onPresetSelect,
}: Props) {
	const { groupedByCategory, isLoading } = useCatalog(organizationId);
	const { presets, isLoading: presetsLoading } = usePresets(organizationId);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"items" | "presets">(mode);
	const [showAllCatalog, setShowAllCatalog] = useState(false);

	useEffect(() => {
		if (open) {
			setActiveTab(mode);
			setShowAllCatalog(false);
		}
	}, [open, mode]);

	// Scope-aware filtering: empty workScopes (legacy studies) keeps the
	// full catalog visible, matching the previous behaviour.
	const inScopeDomains = useMemo(() => {
		return new Set(
			(Object.keys(DOMAIN_TO_SCOPE) as Domain[]).filter((d) =>
				workScopes.includes(DOMAIN_TO_SCOPE[d]),
			),
		);
	}, [workScopes]);
	const scopeFilterAvailable = inScopeDomains.size > 0;
	const scopeFilterActive = scopeFilterAvailable && !showAllCatalog;

	const visibleGrouped = useMemo(() => {
		if (!groupedByCategory || !scopeFilterActive) return groupedByCategory;
		const result: typeof groupedByCategory = {};
		for (const [domain, categories] of Object.entries(groupedByCategory)) {
			if (inScopeDomains.has(domain as Domain)) result[domain] = categories;
		}
		return result;
	}, [groupedByCategory, scopeFilterActive, inScopeDomains]);

	// Out-of-scope domains get a badge when the full catalog is shown.
	const badgeDomains = useMemo(() => {
		if (!scopeFilterAvailable || !showAllCatalog) return undefined;
		return new Set(
			(Object.keys(DOMAIN_TO_SCOPE) as Domain[]).filter(
				(d) => !inScopeDomains.has(d),
			) as string[],
		);
	}, [scopeFilterAvailable, showAllCatalog, inScopeDomains]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex h-[85vh] w-[95vw] max-w-3xl flex-col gap-0 p-0 sm:w-[90vw]"
				dir="rtl"
			>
				<DialogHeader className="border-b px-5 py-4">
					<DialogTitle className="text-start">
						{activeTab === "items"
							? "اختر بنداً من الكتالوج"
							: "اختر باقة جاهزة"}
					</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "items" | "presets")}
					className="flex flex-1 flex-col overflow-hidden px-5 pb-5 pt-3"
				>
					<TabsList className="w-full">
						<TabsTrigger value="items" className="flex-1">
							بنود فردية
						</TabsTrigger>
						<TabsTrigger value="presets" className="flex-1">
							باقات جاهزة
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="items"
						className="mt-3 flex flex-1 flex-col gap-3 overflow-hidden"
					>
						{scopeFilterAvailable && (
							<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
								<Label
									htmlFor="show-all-catalog"
									className="text-sm font-normal"
								>
									عرض كل الكتالوج
								</Label>
								<Switch
									id="show-all-catalog"
									checked={showAllCatalog}
									onCheckedChange={setShowAllCatalog}
								/>
							</div>
						)}
						<CatalogSearch value={searchQuery} onChange={setSearchQuery} />
						<div className="flex-1 overflow-y-auto pe-1">
							<CatalogCategoryTree
								groupedByCategory={visibleGrouped}
								isLoading={isLoading}
								searchQuery={searchQuery}
								onItemSelect={onItemSelect}
								badgeDomains={badgeDomains}
							/>
						</div>
					</TabsContent>

					<TabsContent
						value="presets"
						className="mt-3 flex-1 overflow-y-auto pe-1"
					>
						<PresetsCarousel
							presets={presets}
							isLoading={presetsLoading}
							onSelect={onPresetSelect}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
