"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useState } from "react";
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-4 sm:max-w-2xl"
			>
				<SheetHeader>
					<SheetTitle>
						{mode === "items" ? "اختر بنداً من الكتالوج" : "اختر باقة جاهزة"}
					</SheetTitle>
				</SheetHeader>

				<Tabs
					defaultValue={mode}
					className="flex flex-1 flex-col overflow-hidden px-4 pb-4"
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
						<div className="flex-1 overflow-y-auto pe-2">
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
						className="mt-3 flex-1 overflow-y-auto pe-2"
					>
						<PresetsCarousel
							presets={presets}
							isLoading={presetsLoading}
							onSelect={onPresetSelect}
						/>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
