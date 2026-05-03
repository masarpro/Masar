"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useEffect, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { usePresets } from "../hooks/usePresets";
import type { ItemCatalogEntry } from "../types";
import { CatalogCategoryTree } from "./CatalogCategoryTree";
import { CatalogSearch } from "./CatalogSearch";
import { PresetsCarousel } from "./PresetsCarousel";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "items" | "presets";
	organizationId: string;
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
	onItemSelect,
	onPresetSelect,
}: Props) {
	const { groupedByCategory, isLoading } = useCatalog(organizationId);
	const { presets, isLoading: presetsLoading } = usePresets(organizationId);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"items" | "presets">(mode);

	useEffect(() => {
		if (open) setActiveTab(mode);
	}, [open, mode]);

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
						<CatalogSearch value={searchQuery} onChange={setSearchQuery} />
						<div className="flex-1 overflow-y-auto pe-1">
							<CatalogCategoryTree
								groupedByCategory={groupedByCategory}
								isLoading={isLoading}
								searchQuery={searchQuery}
								onItemSelect={onItemSelect}
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
