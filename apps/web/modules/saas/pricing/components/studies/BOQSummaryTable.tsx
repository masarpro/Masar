"use client";

import { Fragment, useMemo, useState } from "react";
import { useVirtualRows } from "@saas/shared/hooks/use-virtual-rows";
import { resolveImageSrc } from "@saas/shared/lib/image-src";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import {
	Box,
	Columns3,
	Grid3X3,
	Ruler,
	ChevronDown,
	ChevronLeft,
	Download,
	FileSpreadsheet,
	Factory,
	Scissors,
	ClipboardList,
	AlertCircle,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	aggregateBOQ,
	buildFloorFilterOptions,
	filterItemsByFloor,
	getItemFloorGroup,
	type StructuralItem,
	type BOQSection,
	type BOQSubGroup,
	type BOQItemDetail,
	type FactoryOrderEntry,
} from "../../lib/boq-aggregator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import type { CuttingDetailRow } from "../../lib/boq-recalculator";
import {
	exportBOQToExcel,
	exportFactoryOrder,
	exportCuttingDetails,
} from "../../lib/boq-export";
import { formatNumber } from "../../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { BOQExportDropdown } from "./BOQExportDropdown";
import { printBOQ } from "./BOQPrintView";

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface BOQSummaryTableProps {
	items: StructuralItem[];
	studyId: string;
	organizationId: string;
	studyName?: string;
	enabledFloors?: Array<{ id: string; label: string; icon?: string; sortOrder: number }>;
}

// ═══════════════════════════════════════════════════════════════
// Tab types
// ═══════════════════════════════════════════════════════════════

type TabKey = "summary" | "factory" | "cutting";

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function BOQSummaryTable({
	items,
	studyId,
	organizationId,
	studyName,
	enabledFloors,
}: BOQSummaryTableProps) {
	const t = useTranslations("pricing.studies");
	const [activeTab, setActiveTab] = useState<TabKey>("summary");
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
	const [expandedCutting, setExpandedCutting] = useState<Set<string>>(new Set());
	const [selectedFloor, setSelectedFloor] = useState<string>("all");

	// Fetch organization settings (cached)
	const { data: orgSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	const floorOptions = useMemo(
		() => buildFloorFilterOptions(items, enabledFloors),
		[items, enabledFloors],
	);

	const filteredItems = useMemo(
		() => filterItemsByFloor(items, selectedFloor, enabledFloors),
		[items, selectedFloor, enabledFloors],
	);

	const summary = useMemo(() => aggregateBOQ(filteredItems), [filteredItems]);

	// وزن الحديد المخزّن لعناصر لا تنتج صفوف تقطيع (فئة غير مدعومة في المُعيد
	// الحسابي مثل otherStructural أو بيانات تسليح ناقصة) — يُعرض كتحذير في
	// تبويبي طلبية المصنع والتقطيع لأن مجاميعهما تستثنيه (Audit F14)
	const excludedSteelWeight = useMemo(() => {
		let total = 0;
		for (const section of summary.sections) {
			for (const group of section.subGroups) {
				for (const detail of group.items) {
					if (
						detail.item.steelWeight > 0 &&
						(!detail.recalc.hasRebarParams ||
							detail.recalc.cuttingDetails.length === 0)
					) {
						total += detail.item.steelWeight;
					}
				}
			}
		}
		return total;
	}, [summary]);

	const selectedFloorLabel = floorOptions.find((o) => o.value === selectedFloor)?.label;

	const toggleSection = (key: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const toggleCutting = (key: string) => {
		setExpandedCutting((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const orgSettingsAny = orgSettings as any;

	const handlePrint = () => {
		printBOQ({
			activeTab,
			summary,
			studyName,
			floorLabel: selectedFloor !== "all" ? selectedFloorLabel : undefined,
			organizationName: orgSettingsAny?.companyNameAr ?? undefined,
			organizationLogo: resolveImageSrc(orgSettingsAny?.logo),
			organizationAddress: orgSettingsAny?.address ?? undefined,
			organizationPhone: orgSettingsAny?.phone ?? undefined,
			organizationEmail: orgSettingsAny?.email ?? undefined,
			t,
		});
	};

	if (items.length === 0) return null;

	const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
		{ key: "summary", label: t("structural.boq.summaryTab"), icon: ClipboardList },
		{ key: "factory", label: t("structural.boq.factoryTab"), icon: Factory },
		{ key: "cutting", label: t("structural.boq.cuttingTab"), icon: Scissors },
	];

	return (
		<div className="mt-8 space-y-4 print:mt-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold flex items-center gap-2">
					<ClipboardList className="h-5 w-5 text-primary" />
					{t("structural.boq.title")}
				</h3>
				<BOQExportDropdown
					onExcelExport={() => {
						const label = selectedFloor !== "all" && selectedFloorLabel
							? `${studyName || ""} - ${selectedFloorLabel}`.trim()
							: studyName;
						if (activeTab === "factory") {
							exportFactoryOrder(summary.factoryOrder, label);
						} else if (activeTab === "cutting") {
							exportCuttingDetails(summary.allCuttingDetails, label);
						} else {
							exportBOQToExcel(summary, label);
						}
					}}
					onPrint={handlePrint}
				/>
			</div>

			{/* Floor Filter */}
			{floorOptions.length > 2 && (
				<div className="flex items-center gap-3 print:hidden">
					<span className="text-sm font-medium text-muted-foreground">{t("structural.boq.floorFilter")}:</span>
					<Select value={selectedFloor} onValueChange={setSelectedFloor}>
						<SelectTrigger className="w-[220px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{floorOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.icon ? `${option.icon} ` : ""}{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Tabs */}
			<div className="flex gap-1 p-1 bg-muted rounded-lg print:hidden">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							activeTab === tab.key
								? "bg-background text-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<tab.icon className="h-4 w-4" />
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{activeTab === "summary" && (
				<SummaryTab
					summary={summary}
					expandedSections={expandedSections}
					expandedCutting={expandedCutting}
					toggleSection={toggleSection}
					toggleCutting={toggleCutting}
					selectedFloor={selectedFloor}
					enabledFloors={enabledFloors}
				/>
			)}

			{activeTab === "factory" && (
				<FactoryOrderTab
					factoryOrder={summary.factoryOrder}
					studyName={studyName}
					onPrint={handlePrint}
					excludedSteelWeight={excludedSteelWeight}
				/>
			)}

			{activeTab === "cutting" && (
				<CuttingWorkshopTab
					cuttingDetails={summary.allCuttingDetails}
					studyName={studyName}
					onPrint={handlePrint}
					excludedSteelWeight={excludedSteelWeight}
				/>
			)}

		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// Summary Tab
// ═══════════════════════════════════════════════════════════════

function SummaryTab({
	summary,
	expandedSections,
	expandedCutting,
	toggleSection,
	toggleCutting,
	selectedFloor,
	enabledFloors,
}: {
	summary: ReturnType<typeof aggregateBOQ>;
	expandedSections: Set<string>;
	expandedCutting: Set<string>;
	toggleSection: (key: string) => void;
	toggleCutting: (key: string) => void;
	selectedFloor: string;
	enabledFloors?: Array<{ id: string; label: string; icon?: string; sortOrder: number }>;
}) {
	// Floor-specific view: grouped by material
	if (selectedFloor !== "all") {
		return (
			<FloorMaterialView
				summary={summary}
				expandedSections={expandedSections}
				toggleSection={toggleSection}
				enabledFloors={enabledFloors}
			/>
		);
	}

	// Default "all" view: grouped by structural category
	return (
		<div className="space-y-4">
			{/* Sections */}
			{summary.sections.map((section) => (
				<SectionCard
					key={section.category}
					section={section}
					isExpanded={expandedSections.has(section.category)}
					onToggle={() => toggleSection(section.category)}
					expandedCutting={expandedCutting}
					toggleCutting={toggleCutting}
				/>
			))}

			{/* Grand Totals */}
			<GrandTotalCards totals={summary.grandTotals} />
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// Floor Material View (shown when a specific floor is selected)
// ═══════════════════════════════════════════════════════════════

interface MaterialItemRow {
	item: StructuralItem;
	categoryLabel: string;
}

function FloorMaterialView({
	summary,
	expandedSections,
	toggleSection,
	enabledFloors,
}: {
	summary: ReturnType<typeof aggregateBOQ>;
	expandedSections: Set<string>;
	toggleSection: (key: string) => void;
	enabledFloors?: Array<{ id: string; label: string; icon?: string; sortOrder: number }>;
}) {
	const t = useTranslations("pricing.studies");
	// Flatten all items from summary sections with their category label
	const allItemRows: MaterialItemRow[] = [];
	for (const section of summary.sections) {
		for (const group of section.subGroups) {
			for (const detail of group.items) {
				allItemRows.push({ item: detail.item, categoryLabel: section.label });
			}
		}
	}

	// العناصر المشتركة بين الأدوار (سلالم، كمرات، عناصر أخرى)
	const sharedRows = allItemRows.filter(
		(d) => getItemFloorGroup(d.item, enabledFloors) === "shared",
	);

	// بطاقات المواد تشمل العناصر المشتركة أيضاً حتى تتطابق مع بطاقات الإجمالي الكلي
	// المبنية على filterItemsByFloor التي تُدخل العناصر المشتركة (Audit F5)
	const concreteRows = allItemRows.filter((d) => d.item.concreteVolume > 0);
	const steelRows = allItemRows.filter((d) => d.item.steelWeight > 0);
	const blockRows = allItemRows.filter((d) => d.item.category === "blocks");

	const totalConcrete = concreteRows.reduce((s, d) => s + d.item.concreteVolume, 0);
	const totalSteel = steelRows.reduce((s, d) => s + d.item.steelWeight, 0);
	const totalBlocks = blockRows.reduce((s, d) => s + d.item.quantity, 0);

	// مساهمة العناصر المشتركة — تُعرض في ملاحظة توضيحية تحت البطاقات
	const sharedConcrete = sharedRows.reduce((s, d) => s + d.item.concreteVolume, 0);
	const sharedSteel = sharedRows.reduce((s, d) => s + d.item.steelWeight, 0);

	return (
		<div className="space-y-4">
			{/* Concrete Section */}
			{concreteRows.length > 0 && (
				<MaterialSectionCard
					title={t("structural.boq.concreteSection")}
					icon={Box}
					iconColor="text-chart-4"
					borderColor="border-s-chart-4"
					items={concreteRows}
					valueAccessor={(item) => item.concreteVolume}
					valueLabel={t("structural.boq.volume")}
					unit="م³"
					total={totalConcrete}
					isExpanded={expandedSections.has("mat-concrete")}
					onToggle={() => toggleSection("mat-concrete")}
				/>
			)}

			{/* Steel Section */}
			{steelRows.length > 0 && (
				<MaterialSectionCard
					title={t("structural.boq.steelSection")}
					icon={Columns3}
					iconColor="text-chart-1"
					borderColor="border-s-chart-1"
					items={steelRows}
					valueAccessor={(item) => item.steelWeight}
					valueLabel={t("structural.boq.weight")}
					unit="كجم"
					total={totalSteel}
					isExpanded={expandedSections.has("mat-steel")}
					onToggle={() => toggleSection("mat-steel")}
				/>
			)}

			{/* Blocks Section */}
			{blockRows.length > 0 && (
				<MaterialSectionCard
					title={t("structural.boq.blockSection")}
					icon={Grid3X3}
					iconColor="text-success"
					borderColor="border-s-success"
					items={blockRows}
					valueAccessor={(item) => item.quantity}
					valueLabel={t("structural.quantity")}
					unit={t("structural.otherStructural.results.blockUnit")}
					total={totalBlocks}
					isExpanded={expandedSections.has("mat-blocks")}
					onToggle={() => toggleSection("mat-blocks")}
				/>
			)}

			{/* ملاحظة: مجاميع بطاقات المواد أعلاه تشمل العناصر المشتركة بين الأدوار (Audit F5) */}
			{sharedRows.length > 0 && (
				<p className="text-xs text-muted-foreground">
					يشمل عناصر مشتركة بين الأدوار ({formatNumber(sharedConcrete)} م³ خرسانة، {formatNumber(sharedSteel)} كجم حديد)
				</p>
			)}

			{/* Shared Items Section */}
			{sharedRows.length > 0 && (
				<SharedItemsCard
					items={sharedRows}
					isExpanded={expandedSections.has("mat-shared")}
					onToggle={() => toggleSection("mat-shared")}
				/>
			)}

			{/* Grand Totals */}
			<GrandTotalCards totals={summary.grandTotals} />
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Material Section Card
// ─────────────────────────────────────────────────────────────

function MaterialSectionCard({
	title,
	icon: Icon,
	iconColor,
	borderColor,
	items,
	valueAccessor,
	valueLabel,
	unit,
	total,
	isExpanded,
	onToggle,
}: {
	title: string;
	icon: React.ElementType;
	iconColor: string;
	borderColor: string;
	items: MaterialItemRow[];
	valueAccessor: (item: StructuralItem) => number;
	valueLabel: string;
	unit: string;
	total: number;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const t = useTranslations("pricing.studies");
	return (
		<Card className={`border-s-4 ${borderColor} overflow-hidden`}>
			<Collapsible open={isExpanded} onOpenChange={onToggle}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
					>
						<div className="flex items-center gap-3">
							{isExpanded ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							)}
							<Icon className={`h-5 w-5 ${iconColor}`} />
							<span className="font-semibold">{title}</span>
							<Badge variant="secondary" className="text-xs">
								{t("boq.itemsCount", { count: items.length })}
							</Badge>
						</div>
						<span className={`text-sm font-medium ${iconColor}`}>
							{formatNumber(total)} {unit}
						</span>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-4 pb-4 border-t">
						<div className="border rounded-lg overflow-hidden mt-3">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="text-start text-xs">{t("structural.boq.element")}</TableHead>
										<TableHead className="text-start text-xs">{t("structural.boq.category")}</TableHead>
										<TableHead className="text-start text-xs">{t("structural.boq.quantity")}</TableHead>
										<TableHead className="text-start text-xs">{valueLabel}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map(({ item, categoryLabel }) => (
										<TableRow key={item.id}>
											<TableCell className="text-sm font-medium">{item.name}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{categoryLabel}</TableCell>
											<TableCell className="text-sm">{item.quantity}</TableCell>
											<TableCell className={`text-sm font-medium ${iconColor}`}>
												{formatNumber(valueAccessor(item))}
											</TableCell>
										</TableRow>
									))}
									{/* Subtotal */}
									<TableRow className="bg-muted/50 font-bold border-t-2">
										<TableCell colSpan={3}>{t("structural.boq.subtotal")}</TableCell>
										<TableCell className={iconColor}>
											{formatNumber(total)} {unit}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

// ─────────────────────────────────────────────────────────────
// Shared Items Card
// ─────────────────────────────────────────────────────────────

function SharedItemsCard({
	items,
	isExpanded,
	onToggle,
}: {
	items: MaterialItemRow[];
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const t = useTranslations("pricing.studies");
	const totalConcrete = items.reduce((s, d) => s + d.item.concreteVolume, 0);
	const totalSteel = items.reduce((s, d) => s + d.item.steelWeight, 0);

	return (
		<Card className="border-s-4 border-s-border overflow-hidden">
			<Collapsible open={isExpanded} onOpenChange={onToggle}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
					>
						<div className="flex items-center gap-3">
							{isExpanded ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							)}
							<Layers className="h-5 w-5 text-muted-foreground" />
							<span className="font-semibold">{t("structural.boq.sharedItems")}</span>
							<Badge variant="secondary" className="text-xs">
								{t("boq.itemsCount", { count: items.length })}
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm">
							{totalConcrete > 0 && (
								<span className="text-chart-4 font-medium">
									{formatNumber(totalConcrete)} م³
								</span>
							)}
							{totalSteel > 0 && (
								<span className="text-chart-1 font-medium">
									{formatNumber(totalSteel)} كجم
								</span>
							)}
						</div>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-4 pb-4 border-t">
						<p className="text-xs text-muted-foreground mt-2 mb-3">
							{t("structural.boq.sharedItemsDesc")}
						</p>
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="text-start text-xs">{t("structural.boq.element")}</TableHead>
										<TableHead className="text-start text-xs">{t("structural.boq.category")}</TableHead>
										<TableHead className="text-start text-xs">{t("structural.boq.quantity")}</TableHead>
										<TableHead className="text-start text-xs">{t("boq.concreteM3")}</TableHead>
										<TableHead className="text-start text-xs">{t("boq.steelKg")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map(({ item, categoryLabel }) => (
										<TableRow key={item.id}>
											<TableCell className="text-sm font-medium">{item.name}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{categoryLabel}</TableCell>
											<TableCell className="text-sm">{item.quantity}</TableCell>
											<TableCell className="text-sm text-chart-4">
												{formatNumber(item.concreteVolume)}
											</TableCell>
											<TableCell className="text-sm text-chart-1">
												{formatNumber(item.steelWeight)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

// ─────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
	plainConcrete: "border-s-border",
	foundations: "border-s-chart-1",
	groundBeams: "border-s-chart-3",
	beams: "border-s-chart-3",
	columns: "border-s-chart-4",
	slabs: "border-s-success",
	blocks: "border-s-chart-1",
	stairs: "border-s-destructive",
};

function SectionCard({
	section,
	isExpanded,
	onToggle,
	expandedCutting,
	toggleCutting,
}: {
	section: BOQSection;
	isExpanded: boolean;
	onToggle: () => void;
	expandedCutting: Set<string>;
	toggleCutting: (key: string) => void;
}) {
	const t = useTranslations("pricing.studies");
	const borderColor = SECTION_COLORS[section.category] || "border-s-border";

	return (
		<Card className={`border-s-4 ${borderColor} overflow-hidden`}>
			<Collapsible open={isExpanded} onOpenChange={onToggle}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
					>
						<div className="flex items-center gap-3">
							{isExpanded ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							)}
							<span className="text-lg">{section.icon}</span>
							<span className="font-semibold">{section.label}</span>
							<Badge variant="secondary" className="text-xs">
								{t("boq.itemsCount", {
									count: section.subGroups.reduce(
										(s, g) => s + g.items.length,
										0,
									),
								})}
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm">
							{section.totalConcrete > 0 && (
								<span className="text-chart-4 font-medium">
									{formatNumber(section.totalConcrete)} م³
								</span>
							)}
							{section.totalRebar > 0 && (
								<span className="text-chart-1 font-medium">
									{formatNumber(section.totalRebar)} كجم
								</span>
							)}
							{section.totalBlocks > 0 && (
								<span className="text-success font-medium">
									{formatNumber(section.totalBlocks)} {t("structural.otherStructural.results.blockUnit")}
								</span>
							)}
						</div>
					</button>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<div className="px-4 pb-4 space-y-3 border-t">
						{section.subGroups.map((group) => (
							<SubGroupView
								key={group.key}
								group={group}
								category={section.category}
								showGroupHeader={section.subGroups.length > 1}
								expandedCutting={expandedCutting}
								toggleCutting={toggleCutting}
							/>
						))}

						{/* مواد إضافية (عناصر إنشائية أخرى): نظافة، GRC، عزل، حفر، مونة */}
						{section.extras && (
							<div className="flex flex-wrap gap-2 pt-1">
								{section.extras.plainConcrete > 0 && (
									<Badge variant="secondary" className="text-xs gap-1">
										{t("structural.otherStructural.results.concretePlain")}: {formatNumber(section.extras.plainConcrete)} م³
									</Badge>
								)}
								{section.extras.grcWeight > 0 && (
									<Badge variant="secondary" className="text-xs gap-1">
										{t("structural.otherStructural.results.grcWeight")}: {formatNumber(section.extras.grcWeight)} كجم
									</Badge>
								)}
								{section.extras.waterproofingArea > 0 && (
									<Badge variant="secondary" className="text-xs gap-1">
										{t("structural.otherStructural.results.waterproofing")}: {formatNumber(section.extras.waterproofingArea)} م²
									</Badge>
								)}
								{section.extras.excavationVolume > 0 && (
									<Badge variant="secondary" className="text-xs gap-1">
										{t("structural.otherStructural.results.excavation")}: {formatNumber(section.extras.excavationVolume)} م³
									</Badge>
								)}
								{section.extras.mortarVolume > 0 && (
									<Badge variant="secondary" className="text-xs gap-1">
										{t("structural.otherStructural.results.mortar")}: {formatNumber(section.extras.mortarVolume)} م³
									</Badge>
								)}
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

// ─────────────────────────────────────────────────────────────
// Sub-group View
// ─────────────────────────────────────────────────────────────

function SubGroupView({
	group,
	category,
	showGroupHeader,
	expandedCutting,
	toggleCutting,
}: {
	group: BOQSubGroup;
	category: string;
	showGroupHeader: boolean;
	expandedCutting: Set<string>;
	toggleCutting: (key: string) => void;
}) {
	const t = useTranslations("pricing.studies");
	return (
		<div className="space-y-2 pt-2">
			{showGroupHeader && (
				<div className="flex items-center justify-between">
					<h5 className="text-sm font-semibold text-muted-foreground">
						{group.label}
					</h5>
					<div className="flex gap-3 text-xs text-muted-foreground">
						{group.concrete > 0 && (
							<span>{t("boq.concrete")}: {formatNumber(group.concrete)} م³</span>
						)}
						{group.rebar > 0 && (
							<span>{t("boq.steel")}: {formatNumber(group.rebar)} كجم</span>
						)}
						{group.blocks > 0 && (
							<span>{t("boq.blocks")}: {formatNumber(group.blocks)}</span>
						)}
					</div>
				</div>
			)}

			{/* Items table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30">
							<TableHead className="text-start text-xs">{t("structural.boq.element")}</TableHead>
							<TableHead className="text-start text-xs">{t("structural.boq.quantity")}</TableHead>
							<TableHead className="text-start text-xs">{t("boq.concreteM3")}</TableHead>
							<TableHead className="text-start text-xs">{t("boq.steelKg")}</TableHead>
							{category === "blocks" && (
								<TableHead className="text-start text-xs">{t("boq.blocks")}</TableHead>
							)}
							<TableHead className="text-start text-xs w-8"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{group.items.map((detail) => {
							const cutKey = `${category}-${group.key}-${detail.item.id}`;
							const hasCutting = detail.recalc.hasRebarParams && detail.recalc.cuttingDetails.length > 0;
							const isCuttingOpen = expandedCutting.has(cutKey);

							return (
								<Fragment key={detail.item.id}>
									<TableRow>
										<TableCell className="text-sm font-medium">
											{detail.item.name}
										</TableCell>
										<TableCell className="text-sm">
											{detail.item.quantity}
										</TableCell>
										<TableCell className="text-sm text-chart-4">
											{formatNumber(detail.item.concreteVolume)}
										</TableCell>
										<TableCell className="text-sm text-chart-1">
											{formatNumber(detail.item.steelWeight)}
										</TableCell>
										{category === "blocks" && (
											<TableCell className="text-sm text-success">
												{formatNumber(detail.item.quantity)}
											</TableCell>
										)}
										<TableCell>
											{hasCutting ? (
												<button
													type="button"
													onClick={() => toggleCutting(cutKey)}
													className="p-1 rounded hover:bg-muted transition-colors"
													title={t("boq.cuttingDetails")}
												>
													<Scissors className="h-3.5 w-3.5 text-muted-foreground" />
												</button>
											) : category !== "plainConcrete" && category !== "blocks" ? (
												<span title={t("boq.cuttingDetailsUnavailable")}>
													<AlertCircle className="h-3.5 w-3.5 text-chart-1" />
												</span>
											) : null}
										</TableCell>
									</TableRow>

									{/* Inline cutting details */}
									{hasCutting && isCuttingOpen && (
										<TableRow>
											<TableCell
												colSpan={category === "blocks" ? 6 : 5}
												className="p-0"
											>
												<CuttingDetailsInline
													details={detail.recalc.cuttingDetails}
													totals={detail.recalc.totals}
												/>
											</TableCell>
										</TableRow>
									)}
								</Fragment>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Inline Cutting Details
// ─────────────────────────────────────────────────────────────

function CuttingDetailsInline({
	details,
	totals,
}: {
	details: CuttingDetailRow[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
}) {
	const t = useTranslations("pricing.studies");
	return (
		<div className="bg-muted/20 p-3 space-y-2">
			<h6 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
				<Scissors className="h-3 w-3" />
				{t("boq.cuttingDetails")}
			</h6>

			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-muted-foreground">
							<th className="text-start py-1 px-2">{t("boq.description")}</th>
							<th className="text-start py-1 px-2">{t("structural.diameter")}</th>
							<th className="text-start py-1 px-2">{t("boq.pieceLength")}</th>
							<th className="text-start py-1 px-2">{t("structural.quantity")}</th>
							<th className="text-start py-1 px-2">{t("boq.factoryBars")}</th>
							<th className="text-start py-1 px-2">{t("boq.wastePercent")}</th>
							<th className="text-start py-1 px-2">{t("boq.weight")}</th>
						</tr>
					</thead>
					<tbody>
						{details.map((d, i) => (
							<tr key={i} className="border-b border-muted">
								<td className="py-1 px-2">{d.description}</td>
								<td className="py-1 px-2">{d.diameter} مم</td>
								<td className="py-1 px-2">{d.barLength} م</td>
								<td className="py-1 px-2">{d.barCount}</td>
								<td className="py-1 px-2">{d.stocksNeeded}</td>
								<td className="py-1 px-2">
									<span
										className={
											d.wastePercentage > 15
												? "text-destructive"
												: d.wastePercentage > 8
													? "text-chart-1"
													: "text-success"
										}
									>
										{d.wastePercentage}%
									</span>
								</td>
								<td className="py-1 px-2">{formatNumber(d.grossWeight)} كجم</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Stocks needed summary */}
			{totals.stocksNeeded.length > 0 && (
				<div className="flex gap-2 flex-wrap pt-1">
					<span className="text-xs text-muted-foreground">{t("boq.requiredFromFactory")}:</span>
					{totals.stocksNeeded.map((s, i) => (
						<Badge key={i} variant="outline" className="text-xs">
							Ø{s.diameter} × {s.count} {t("boq.barUnit")}
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Grand Total Cards
// ─────────────────────────────────────────────────────────────

function GrandTotalCards({
	totals,
}: {
	totals: { concrete: number; rebar: number; blocks: number; formwork: number };
}) {
	const t = useTranslations("pricing.studies");
	const cards = [
		{
			title: t("totalConcrete"),
			icon: Box,
			value: totals.concrete > 0 ? formatNumber(totals.concrete) : "—",
			unit: "م³",
			color: "text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			borderColor: "border-chart-4 dark:border-chart-4",
		},
		{
			title: t("structural.totalSteel"),
			icon: Columns3,
			value: totals.rebar > 0 ? formatNumber(totals.rebar / 1000, 2) : "—",
			unit: "طن",
			subValue:
				totals.rebar > 0
					? `(${formatNumber(totals.rebar)} كجم)`
					: undefined,
			color: "text-chart-1",
			bgColor: "bg-orange-50 dark:bg-orange-950/30",
			borderColor: "border-orange-200 dark:border-orange-800",
		},
		{
			title: t("boq.totalBlocks"),
			icon: Grid3X3,
			value: totals.blocks > 0 ? formatNumber(totals.blocks) : "—",
			unit: t("structural.otherStructural.results.blockUnit"),
			color: "text-success",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
			borderColor: "border-emerald-200 dark:border-emerald-800",
		},
		{
			title: t("boq.totalFormwork"),
			icon: Ruler,
			value: totals.formwork > 0 ? formatNumber(totals.formwork) : "—",
			unit: "م²",
			color: "text-chart-1",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			borderColor: "border-amber-200 dark:border-amber-800",
		},
	];

	return (
		<div className="border-t-2 border-dashed pt-4 mt-4">
			<h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
				<span className="w-6 h-0.5 bg-primary inline-block" />
				{t("structural.boq.grandTotal")}
				<span className="w-6 h-0.5 bg-primary inline-block" />
			</h4>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{cards.map((card, index) => (
					<Card key={index} className={card.borderColor}>
						<CardContent className="p-3">
							<div className="flex items-start justify-between">
								<div className="space-y-0.5">
									<p className="text-xs text-muted-foreground font-medium">
										{card.title}
									</p>
									<p className={`text-xl font-bold ${card.color}`}>
										{card.value}{" "}
										<span className="text-sm font-normal">{card.unit}</span>
									</p>
									{"subValue" in card && card.subValue && (
										<p className="text-xs text-muted-foreground">
											{card.subValue}
										</p>
									)}
								</div>
								<div className={`p-2 rounded-lg ${card.bgColor}`}>
									<card.icon className={`h-4 w-4 ${card.color}`} />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// Factory Order Tab
// ═══════════════════════════════════════════════════════════════

function FactoryOrderTab({
	factoryOrder,
	studyName,
	onPrint,
	excludedSteelWeight,
}: {
	factoryOrder: FactoryOrderEntry[];
	studyName?: string;
	onPrint: () => void;
	excludedSteelWeight: number;
}) {
	const t = useTranslations("pricing.studies");
	const totalBars = factoryOrder.reduce((s, e) => s + e.count, 0);
	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);

	if (factoryOrder.length === 0) {
		return (
			<Card className="p-8 text-center text-muted-foreground">
				<Factory className="h-12 w-12 mx-auto mb-3 opacity-30" />
				<p>{t("boq.noFactoryData")}</p>
				<p className="text-xs mt-1">{t("boq.addItemsWithRebarFirst")}</p>
				{excludedSteelWeight > 0 && (
					<p className="text-xs mt-2">
						⚠ يستثني حديد العناصر غير المدعومة في التقطيع ({formatNumber(excludedSteelWeight)} كجم)
					</p>
				)}
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Factory className="h-5 w-5 text-primary" />
					<h4 className="font-semibold">{t("boq.factoryOrderTitle")}</h4>
				</div>
				<BOQExportDropdown
					onExcelExport={() => exportFactoryOrder(factoryOrder, studyName)}
					onPrint={onPrint}
					label={t("boq.export")}
				/>
			</div>

			{/* تحذير: حديد مخزّن لعناصر لا يدعمها المُعيد الحسابي (Audit F14) */}
			{excludedSteelWeight > 0 && (
				<p className="text-xs text-muted-foreground">
					⚠ يستثني حديد العناصر غير المدعومة في التقطيع ({formatNumber(excludedSteelWeight)} كجم)
				</p>
			)}

			<Card>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead className="text-start">{t("boq.diameterMm")}</TableHead>
								<TableHead className="text-start">{t("boq.stockLengthM")}</TableHead>
								<TableHead className="text-start">{t("boq.barsCount")}</TableHead>
								<TableHead className="text-start">{t("structural.boq.weight")}</TableHead>
								<TableHead className="text-start">{t("boq.weightTon")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{factoryOrder.map((entry, i) => (
								<TableRow key={i}>
									<TableCell className="font-medium">
										<Badge variant="outline">Ø{entry.diameter}</Badge>
									</TableCell>
									<TableCell>{entry.stockLength}</TableCell>
									<TableCell className="font-medium">
										{entry.count}
									</TableCell>
									<TableCell>
										{formatNumber(entry.weight)}
									</TableCell>
									<TableCell className="font-bold text-chart-1">
										{formatNumber(entry.weight / 1000, 3)}
									</TableCell>
								</TableRow>
							))}

							{/* Total row */}
							<TableRow className="bg-muted/50 font-bold border-t-2">
								<TableCell>{t("structural.boq.subtotal")}</TableCell>
								<TableCell></TableCell>
								<TableCell>{totalBars}</TableCell>
								<TableCell>{formatNumber(totalWeight)}</TableCell>
								<TableCell className="text-chart-1 text-lg">
									{formatNumber(totalWeight / 1000, 3)} طن
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// Cutting Workshop Tab
// ═══════════════════════════════════════════════════════════════

function CuttingWorkshopTab({
	cuttingDetails,
	studyName,
	onPrint,
	excludedSteelWeight,
}: {
	cuttingDetails: CuttingDetailRow[];
	studyName?: string;
	onPrint: () => void;
	excludedSteelWeight: number;
}) {
	const t = useTranslations("pricing.studies");
	if (cuttingDetails.length === 0) {
		return (
			<Card className="p-8 text-center text-muted-foreground">
				<Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
				<p>{t("boq.noCuttingData")}</p>
				<p className="text-xs mt-1">{t("boq.addItemsWithRebarFirst")}</p>
				{excludedSteelWeight > 0 && (
					<p className="text-xs mt-2">
						⚠ يستثني حديد العناصر غير المدعومة في التقطيع ({formatNumber(excludedSteelWeight)} كجم)
					</p>
				)}
			</Card>
		);
	}

	// Group by diameter
	const diameterGroups = new Map<number, CuttingDetailRow[]>();
	cuttingDetails.forEach((d) => {
		const list = diameterGroups.get(d.diameter) || [];
		list.push(d);
		diameterGroups.set(d.diameter, list);
	});

	const sortedDiameters = Array.from(diameterGroups.keys()).sort((a, b) => a - b);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Scissors className="h-5 w-5 text-primary" />
					<h4 className="font-semibold">{t("boq.cuttingWorkshopTitle")}</h4>
				</div>
				<BOQExportDropdown
					onExcelExport={() => exportCuttingDetails(cuttingDetails, studyName)}
					onPrint={onPrint}
					label={t("boq.export")}
				/>
			</div>

			{/* تحذير: حديد مخزّن لعناصر لا يدعمها المُعيد الحسابي (Audit F14) */}
			{excludedSteelWeight > 0 && (
				<p className="text-xs text-muted-foreground">
					⚠ يستثني حديد العناصر غير المدعومة في التقطيع ({formatNumber(excludedSteelWeight)} كجم)
				</p>
			)}

			{sortedDiameters.map((diameter) => {
				const group = diameterGroups.get(diameter)!;
				const groupWeight = group.reduce((s, d) => s + d.grossWeight, 0);
				const groupStocks = group.reduce((s, d) => s + d.stocksNeeded, 0);

				return (
					<Card key={diameter}>
						<div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
									Ø{diameter} مم
								</Badge>
								<span className="text-xs text-muted-foreground">
									{t("boq.cutOperationsCount", { count: group.length })}
								</span>
							</div>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<span>{t("boq.factoryBarsCount", { count: groupStocks })}</span>
								<span className="font-medium text-chart-1">
									{formatNumber(groupWeight)} كجم
								</span>
							</div>
						</div>
						<CuttingDiameterTable group={group} />
					</Card>
				);
			})}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Cutting Diameter Table (virtualized for large groups)
// ─────────────────────────────────────────────────────────────

function CuttingDiameterTable({ group }: { group: CuttingDetailRow[] }) {
	const t = useTranslations("pricing.studies");
	const { containerRef, virtualItems, paddingTop, paddingBottom, isVirtualized } =
		useVirtualRows({ count: group.length, rowHeight: 40, threshold: 50 });

	return (
		<div
			ref={containerRef}
			className="overflow-x-auto"
			style={isVirtualized ? { maxHeight: 400 } : undefined}
		>
			<table className="w-full caption-bottom text-sm">
				<TableHeader className={isVirtualized ? "sticky top-0 z-10 bg-background" : ""}>
					<TableRow>
						<TableHead className="text-start text-xs">{t("structural.boq.element")}</TableHead>
						<TableHead className="text-start text-xs">{t("boq.description")}</TableHead>
						<TableHead className="text-start text-xs">{t("boq.pieceLengthM")}</TableHead>
						<TableHead className="text-start text-xs">{t("structural.quantity")}</TableHead>
						<TableHead className="text-start text-xs">{t("boq.factoryBars")}</TableHead>
						<TableHead className="text-start text-xs">{t("boq.wastePercent")}</TableHead>
						<TableHead className="text-start text-xs">{t("structural.boq.weight")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isVirtualized && paddingTop > 0 && (
						<tr style={{ height: paddingTop }} />
					)}
					{(isVirtualized
						? virtualItems.map((vi: { index: number }) => group[vi.index])
						: group
					).map((d: CuttingDetailRow, i: number) => (
						<TableRow key={isVirtualized ? virtualItems[i].index : i}>
							<TableCell className="text-sm">{d.element}</TableCell>
							<TableCell className="text-sm text-muted-foreground">
								{d.description}
							</TableCell>
							<TableCell className="text-sm font-medium">
								{d.barLength}
							</TableCell>
							<TableCell className="text-sm">{d.barCount}</TableCell>
							<TableCell className="text-sm">{d.stocksNeeded}</TableCell>
							<TableCell className="text-sm">
								<span
									className={
										d.wastePercentage > 15
											? "text-destructive font-medium"
											: d.wastePercentage > 8
												? "text-chart-1"
												: "text-success"
									}
								>
									{d.wastePercentage}%
								</span>
							</TableCell>
							<TableCell className="text-sm font-medium">
								{formatNumber(d.grossWeight)}
							</TableCell>
						</TableRow>
					))}
					{isVirtualized && paddingBottom > 0 && (
						<tr style={{ height: paddingBottom }} />
					)}
				</TableBody>
			</table>
		</div>
	);
}
