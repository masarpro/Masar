"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CatalogPickerDrawer } from "./catalog-picker/CatalogPickerDrawer";
import { ContextDrawer } from "./context-drawer/ContextDrawer";
import { useCostStudy } from "./hooks/useCostStudy";
import { useDomainFilter } from "./hooks/useDomainFilter";
import { useStudyTotals } from "./hooks/useStudyTotals";
import { useUnifiedQuantities } from "./hooks/useUnifiedQuantities";
import { EmptyState } from "./items-list/EmptyState";
import { ItemsList } from "./items-list/ItemsList";
import { QuoteDrawer } from "./quote/QuoteDrawer";
import { ErrorState } from "./shared/ErrorState";
import { LoadingSkeleton } from "./shared/LoadingSkeleton";
import { ItemDetailDialog } from "./spreadsheet-view/ItemDetailDialog";
import {
	DOMAIN_TO_SCOPE,
	type CalculationMethod,
	type Domain,
	type ItemCatalogEntry,
	type QuantityItem,
} from "./types";
import { ProfitControlCard } from "./workspace-header/ProfitControlCard";
import {
	WorkspaceBar,
	type ViewMode,
} from "./workspace-bar/WorkspaceBar";

const VIEW_MODE_KEY = "masar:unified-workspace:view-mode";

function readSavedViewMode(): ViewMode | null {
	if (typeof window === "undefined") return null;
	try {
		const v = window.localStorage.getItem(VIEW_MODE_KEY);
		return v === "spreadsheet" || v === "cards" ? v : null;
	} catch {
		return null;
	}
}

interface Props {
	costStudyId: string;
	organizationId: string;
}

export function UnifiedItemsWorkspace({
	costStudyId,
	organizationId,
}: Props) {
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pickerMode, setPickerMode] = useState<"items" | "presets">("items");
	const [contextOpen, setContextOpen] = useState(false);
	const [quoteOpen, setQuoteOpen] = useState(false);
	const [savedViewMode, setSavedViewMode] = useState<ViewMode | null>(() =>
		readSavedViewMode(),
	);
	const [detailItemId, setDetailItemId] = useState<string | null>(null);

	const {
		items,
		isLoading,
		error,
		upsertItem,
		deleteItem,
		duplicateItem,
		reorderItems,
		applyPreset,
	} = useUnifiedQuantities({ costStudyId, organizationId });

	// Auto-pick: spreadsheet for empty/large studies, cards for 1-4 items.
	// Only applies before the user has made an explicit choice.
	const resolvedViewMode: ViewMode =
		savedViewMode ?? (items.length >= 1 && items.length < 5 ? "cards" : "spreadsheet");

	const handleViewModeChange = (mode: ViewMode) => {
		setSavedViewMode(mode);
		try {
			window.localStorage.setItem(VIEW_MODE_KEY, mode);
		} catch {
			// ignore quota / private mode
		}
	};

	const { globalMarkupPercent, study } = useCostStudy(
		costStudyId,
		organizationId,
	);
	const workScopes = (study?.workScopes as string[] | undefined) ?? [];
	const { totals } = useStudyTotals({ costStudyId, organizationId });

	// Conscious scope expansion: adding an out-of-scope catalog item keeps
	// its real domain and widens the study's workScopes to match, so the
	// unified gate, config bar and scope-filtered catalog stay consistent.
	const queryClient = useQueryClient();
	const updateConfigMutation = useMutation(
		orpc.pricing.studies.updateConfig.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const expandScopesIfNeeded = async (domain: Domain) => {
		const requiredScope = DOMAIN_TO_SCOPE[domain];
		// Legacy studies with empty workScopes see the whole catalog and
		// have no scope config to widen — leave them untouched.
		if (
			!requiredScope ||
			workScopes.length === 0 ||
			workScopes.includes(requiredScope)
		) {
			return;
		}
		try {
			await updateConfigMutation.mutateAsync({
				studyId: costStudyId,
				organizationId,
				workScopes: [...workScopes, requiredScope],
			} as never);
			toast.success(
				requiredScope === "FINISHING"
					? "أُضيف نطاق التشطيبات إلى الدراسة"
					: "أُضيف نطاق الكهروميكانيكا إلى الدراسة",
			);
		} catch {
			toast.error("تعذّر توسيع نطاق الدراسة — أضف النطاق يدوياً من صيغة الدراسة");
		}
	};

	const {
		selectedDomains,
		toggleDomain,
		clearDomains,
		domainCounts,
		filteredItems,
	} = useDomainFilter(items);

	if (isLoading) return <LoadingSkeleton />;
	if (error) return <ErrorState error={error} />;

	const handleAddItem = async (entry: ItemCatalogEntry) => {
		await upsertItem({
			costStudyId,
			organizationId,
			domain: entry.domain as Domain,
			categoryKey: entry.categoryKey,
			catalogItemKey: entry.itemKey,
			displayName: entry.nameAr,
			calculationMethod:
				entry.defaultCalculationMethod as CalculationMethod,
			unit: entry.unit,
			wastagePercent: Number(entry.defaultWastagePercent),
			materialUnitPrice:
				entry.defaultMaterialUnitPrice != null
					? Number(entry.defaultMaterialUnitPrice)
					: undefined,
			laborUnitPrice:
				entry.defaultLaborUnitPrice != null
					? Number(entry.defaultLaborUnitPrice)
					: undefined,
			sortOrder: items.length,
			markupMethod: "percentage",
			hasCustomMarkup: false,
		} as never);
		await expandScopesIfNeeded(entry.domain as Domain);
	};

	const totalGrossCost = Number(totals?.totalGrossCost ?? 0);
	const totalSellAmount = Number(totals?.totalSellAmount ?? 0);
	const totalProfitAmount = Number(totals?.totalProfitAmount ?? 0);
	const totalProfitPercent = Number(totals?.totalProfitPercent ?? 0);
	const customMarkupCount = (items as QuantityItem[]).filter(
		(i) => i.hasCustomMarkup,
	).length;

	return (
		<div className="flex flex-col gap-4 pb-20" dir="rtl">
			<WorkspaceBar
				totalGrossCost={totalGrossCost}
				totalSellAmount={totalSellAmount}
				totalProfitAmount={totalProfitAmount}
				totalProfitPercent={totalProfitPercent}
				itemCount={items.length}
				domainCounts={domainCounts}
				selectedDomains={selectedDomains}
				onToggleDomain={toggleDomain}
				onClearDomains={clearDomains}
				onAddItem={() => {
					setPickerMode("items");
					setPickerOpen(true);
				}}
				onApplyPreset={() => {
					setPickerMode("presets");
					setPickerOpen(true);
				}}
				onGenerateQuote={() => setQuoteOpen(true)}
				onOpenContext={() => setContextOpen(true)}
				canGenerateQuote={items.length > 0}
				viewMode={resolvedViewMode}
				onViewModeChange={handleViewModeChange}
			/>

			{items.length > 0 && (
				<ProfitControlCard
					costStudyId={costStudyId}
					organizationId={organizationId}
					currentValue={globalMarkupPercent}
					customMarkupCount={customMarkupCount}
				/>
			)}

			{items.length === 0 ? (
				<EmptyState
					onAddItem={() => {
						setPickerMode("items");
						setPickerOpen(true);
					}}
					onApplyPreset={() => {
						setPickerMode("presets");
						setPickerOpen(true);
					}}
				/>
			) : (
				<ItemsList
					items={filteredItems}
					costStudyId={costStudyId}
					organizationId={organizationId}
					globalMarkupPercent={globalMarkupPercent}
					viewMode={resolvedViewMode}
					onOpenDetail={setDetailItemId}
					onUpsert={upsertItem}
					onDelete={deleteItem}
					onDuplicate={duplicateItem}
					onReorder={reorderItems}
				/>
			)}

			<ItemDetailDialog
				item={
					detailItemId
						? (items as QuantityItem[]).find(
								(i) => i.id === detailItemId,
							) ?? null
						: null
				}
				open={Boolean(detailItemId)}
				onOpenChange={(open) => {
					if (!open) setDetailItemId(null);
				}}
				globalMarkupPercent={globalMarkupPercent}
			/>

			<CatalogPickerDrawer
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode={pickerMode}
				organizationId={organizationId}
				workScopes={workScopes}
				onItemSelect={async (entry) => {
					await handleAddItem(entry);
					setPickerOpen(false);
				}}
				onPresetSelect={async (presetKey) => {
					await applyPreset({
						costStudyId,
						organizationId,
						presetKey,
					} as never);
					setPickerOpen(false);
				}}
			/>

			<ContextDrawer
				open={contextOpen}
				onOpenChange={setContextOpen}
				costStudyId={costStudyId}
				organizationId={organizationId}
			/>

			<QuoteDrawer
				open={quoteOpen}
				onOpenChange={setQuoteOpen}
				costStudyId={costStudyId}
				organizationId={organizationId}
			/>
		</div>
	);
}
