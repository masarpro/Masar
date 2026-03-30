"use client";

import { Fragment, useMemo, useState } from "react";
import { useVirtualRows } from "@saas/shared/hooks/use-virtual-rows";
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
	const t = useTranslations();
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
			organizationLogo: orgSettingsAny?.logo ?? undefined,
			organizationAddress: orgSettingsAny?.address ?? undefined,
			organizationPhone: orgSettingsAny?.phone ?? undefined,
			organizationEmail: orgSettingsAny?.email ?? undefined,
		});
	};

	if (items.length === 0) return null;

	const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
		{ key: "summary", label: "ملخص الكميات", icon: ClipboardList },
		{ key: "factory", label: "طلبية المصنع", icon: Factory },
		{ key: "cutting", label: "تفاصيل التفصيل", icon: Scissors },
	];

	return (
		<div className="mt-8 space-y-4 print:mt-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold flex items-center gap-2">
					<ClipboardList className="h-5 w-5 text-primary" />
					جدول الكميات الإجمالي
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
					<span className="text-sm font-medium text-muted-foreground">تصفية حسب الدور:</span>
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
								? "bg-background text-foreground shadow-sm"
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
				/>
			)}

			{activeTab === "cutting" && (
				<CuttingWorkshopTab
					cuttingDetails={summary.allCuttingDetails}
					studyName={studyName}
					onPrint={handlePrint}
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
	// Flatten all items from summary sections with their category label
	const allItemRows: MaterialItemRow[] = [];
	for (const section of summary.sections) {
		for (const group of section.subGroups) {
			for (const detail of group.items) {
				allItemRows.push({ item: detail.item, categoryLabel: section.label });
			}
		}
	}

	// Split into floor-specific and shared
	const floorRows = allItemRows.filter(
		(d) => getItemFloorGroup(d.item, enabledFloors) !== "shared",
	);
	const sharedRows = allItemRows.filter(
		(d) => getItemFloorGroup(d.item, enabledFloors) === "shared",
	);

	// Material groups from floor-specific items
	const concreteRows = floorRows.filter((d) => d.item.concreteVolume > 0);
	const steelRows = floorRows.filter((d) => d.item.steelWeight > 0);
	const blockRows = floorRows.filter((d) => d.item.category === "blocks");

	const totalConcrete = concreteRows.reduce((s, d) => s + d.item.concreteVolume, 0);
	const totalSteel = steelRows.reduce((s, d) => s + d.item.steelWeight, 0);
	const totalBlocks = blockRows.reduce((s, d) => s + d.item.quantity, 0);

	return (
		<div className="space-y-4">
			{/* Concrete Section */}
			{concreteRows.length > 0 && (
				<MaterialSectionCard
					title="الخرسانة"
					icon={Box}
					iconColor="text-blue-600"
					borderColor="border-l-blue-500"
					items={concreteRows}
					valueAccessor={(item) => item.concreteVolume}
					valueLabel="الحجم (م³)"
					unit="م³"
					total={totalConcrete}
					isExpanded={expandedSections.has("mat-concrete")}
					onToggle={() => toggleSection("mat-concrete")}
				/>
			)}

			{/* Steel Section */}
			{steelRows.length > 0 && (
				<MaterialSectionCard
					title="حديد التسليح"
					icon={Columns3}
					iconColor="text-orange-600"
					borderColor="border-l-orange-500"
					items={steelRows}
					valueAccessor={(item) => item.steelWeight}
					valueLabel="الوزن (كجم)"
					unit="كجم"
					total={totalSteel}
					isExpanded={expandedSections.has("mat-steel")}
					onToggle={() => toggleSection("mat-steel")}
				/>
			)}

			{/* Blocks Section */}
			{blockRows.length > 0 && (
				<MaterialSectionCard
					title="البلوك"
					icon={Grid3X3}
					iconColor="text-emerald-600"
					borderColor="border-l-emerald-500"
					items={blockRows}
					valueAccessor={(item) => item.quantity}
					valueLabel="العدد"
					unit="بلوكة"
					total={totalBlocks}
					isExpanded={expandedSections.has("mat-blocks")}
					onToggle={() => toggleSection("mat-blocks")}
				/>
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
	return (
		<Card className={`border-r-4 ${borderColor} overflow-hidden`}>
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
								{items.length} عنصر
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
										<TableHead className="text-right text-xs">العنصر</TableHead>
										<TableHead className="text-right text-xs">التصنيف</TableHead>
										<TableHead className="text-right text-xs">الكمية</TableHead>
										<TableHead className="text-right text-xs">{valueLabel}</TableHead>
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
										<TableCell colSpan={3}>الإجمالي</TableCell>
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
	const totalConcrete = items.reduce((s, d) => s + d.item.concreteVolume, 0);
	const totalSteel = items.reduce((s, d) => s + d.item.steelWeight, 0);

	return (
		<Card className="border-r-4 border-l-slate-400 overflow-hidden">
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
							<Layers className="h-5 w-5 text-slate-500" />
							<span className="font-semibold">عناصر مشتركة</span>
							<Badge variant="secondary" className="text-xs">
								{items.length} عنصر
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm">
							{totalConcrete > 0 && (
								<span className="text-blue-600 font-medium">
									{formatNumber(totalConcrete)} م³
								</span>
							)}
							{totalSteel > 0 && (
								<span className="text-orange-600 font-medium">
									{formatNumber(totalSteel)} كجم
								</span>
							)}
						</div>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-4 pb-4 border-t">
						<p className="text-xs text-muted-foreground mt-2 mb-3">
							عناصر لا تنتمي لدور محدد (مثل الكمرات)
						</p>
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="text-right text-xs">العنصر</TableHead>
										<TableHead className="text-right text-xs">التصنيف</TableHead>
										<TableHead className="text-right text-xs">الكمية</TableHead>
										<TableHead className="text-right text-xs">خرسانة (م³)</TableHead>
										<TableHead className="text-right text-xs">حديد (كجم)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map(({ item, categoryLabel }) => (
										<TableRow key={item.id}>
											<TableCell className="text-sm font-medium">{item.name}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{categoryLabel}</TableCell>
											<TableCell className="text-sm">{item.quantity}</TableCell>
											<TableCell className="text-sm text-blue-600">
												{formatNumber(item.concreteVolume)}
											</TableCell>
											<TableCell className="text-sm text-orange-600">
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
	plainConcrete: "border-l-gray-500",
	foundations: "border-l-amber-500",
	groundBeams: "border-l-teal-500",
	beams: "border-l-blue-500",
	columns: "border-l-purple-500",
	slabs: "border-l-emerald-500",
	blocks: "border-l-orange-500",
	stairs: "border-l-rose-500",
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
	const borderColor = SECTION_COLORS[section.category] || "border-l-gray-400";

	return (
		<Card className={`border-r-4 ${borderColor} overflow-hidden`}>
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
								{section.subGroups.reduce(
									(s, g) => s + g.items.length,
									0,
								)}{" "}
								عنصر
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm">
							{section.totalConcrete > 0 && (
								<span className="text-blue-600 font-medium">
									{formatNumber(section.totalConcrete)} م³
								</span>
							)}
							{section.totalRebar > 0 && (
								<span className="text-orange-600 font-medium">
									{formatNumber(section.totalRebar)} كجم
								</span>
							)}
							{section.totalBlocks > 0 && (
								<span className="text-emerald-600 font-medium">
									{formatNumber(section.totalBlocks)} بلوكة
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
	return (
		<div className="space-y-2 pt-2">
			{showGroupHeader && (
				<div className="flex items-center justify-between">
					<h5 className="text-sm font-semibold text-muted-foreground">
						{group.label}
					</h5>
					<div className="flex gap-3 text-xs text-muted-foreground">
						{group.concrete > 0 && (
							<span>خرسانة: {formatNumber(group.concrete)} م³</span>
						)}
						{group.rebar > 0 && (
							<span>حديد: {formatNumber(group.rebar)} كجم</span>
						)}
						{group.blocks > 0 && (
							<span>بلوك: {formatNumber(group.blocks)}</span>
						)}
					</div>
				</div>
			)}

			{/* Items table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30">
							<TableHead className="text-right text-xs">العنصر</TableHead>
							<TableHead className="text-right text-xs">الكمية</TableHead>
							<TableHead className="text-right text-xs">خرسانة (م³)</TableHead>
							<TableHead className="text-right text-xs">حديد (كجم)</TableHead>
							{category === "blocks" && (
								<TableHead className="text-right text-xs">بلوك</TableHead>
							)}
							<TableHead className="text-right text-xs w-8"></TableHead>
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
										<TableCell className="text-sm text-blue-600">
											{formatNumber(detail.item.concreteVolume)}
										</TableCell>
										<TableCell className="text-sm text-orange-600">
											{formatNumber(detail.item.steelWeight)}
										</TableCell>
										{category === "blocks" && (
											<TableCell className="text-sm text-emerald-600">
												{formatNumber(detail.item.quantity)}
											</TableCell>
										)}
										<TableCell>
											{hasCutting ? (
												<button
													type="button"
													onClick={() => toggleCutting(cutKey)}
													className="p-1 rounded hover:bg-muted transition-colors"
													title="تفاصيل القص"
												>
													<Scissors className="h-3.5 w-3.5 text-muted-foreground" />
												</button>
											) : category !== "plainConcrete" && category !== "blocks" ? (
												<span title="تفاصيل القص غير متوفرة - يرجى تحديث العنصر">
													<AlertCircle className="h-3.5 w-3.5 text-amber-400" />
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
	return (
		<div className="bg-muted/20 p-3 space-y-2">
			<h6 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
				<Scissors className="h-3 w-3" />
				تفاصيل القص
			</h6>

			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-muted-foreground">
							<th className="text-right py-1 px-2">الوصف</th>
							<th className="text-right py-1 px-2">القطر</th>
							<th className="text-right py-1 px-2">طول القطعة</th>
							<th className="text-right py-1 px-2">العدد</th>
							<th className="text-right py-1 px-2">أسياخ مصنع</th>
							<th className="text-right py-1 px-2">الهالك %</th>
							<th className="text-right py-1 px-2">الوزن</th>
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
												? "text-red-600"
												: d.wastePercentage > 8
													? "text-amber-600"
													: "text-green-600"
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
					<span className="text-xs text-muted-foreground">المطلوب من المصنع:</span>
					{totals.stocksNeeded.map((s, i) => (
						<Badge key={i} variant="outline" className="text-xs">
							Ø{s.diameter} × {s.count} سيخ
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
	const cards = [
		{
			title: "إجمالي الخرسانة",
			icon: Box,
			value: totals.concrete > 0 ? formatNumber(totals.concrete) : "—",
			unit: "م³",
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
			borderColor: "border-blue-200 dark:border-blue-800",
		},
		{
			title: "إجمالي الحديد",
			icon: Columns3,
			value: totals.rebar > 0 ? formatNumber(totals.rebar / 1000, 2) : "—",
			unit: "طن",
			subValue:
				totals.rebar > 0
					? `(${formatNumber(totals.rebar)} كجم)`
					: undefined,
			color: "text-orange-600",
			bgColor: "bg-orange-50 dark:bg-orange-950/30",
			borderColor: "border-orange-200 dark:border-orange-800",
		},
		{
			title: "إجمالي البلوك",
			icon: Grid3X3,
			value: totals.blocks > 0 ? formatNumber(totals.blocks) : "—",
			unit: "بلوكة",
			color: "text-emerald-600",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
			borderColor: "border-emerald-200 dark:border-emerald-800",
		},
		{
			title: "إجمالي الطوبار",
			icon: Ruler,
			value: totals.formwork > 0 ? formatNumber(totals.formwork) : "—",
			unit: "م²",
			color: "text-amber-600",
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			borderColor: "border-amber-200 dark:border-amber-800",
		},
	];

	return (
		<div className="border-t-2 border-dashed pt-4 mt-4">
			<h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
				<span className="w-6 h-0.5 bg-primary inline-block" />
				الإجمالي العام
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
}: {
	factoryOrder: FactoryOrderEntry[];
	studyName?: string;
	onPrint: () => void;
}) {
	const totalBars = factoryOrder.reduce((s, e) => s + e.count, 0);
	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);

	if (factoryOrder.length === 0) {
		return (
			<Card className="p-8 text-center text-muted-foreground">
				<Factory className="h-12 w-12 mx-auto mb-3 opacity-30" />
				<p>لا توجد بيانات لطلبية المصنع</p>
				<p className="text-xs mt-1">أضف عناصر إنشائية مع بيانات التسليح أولاً</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Factory className="h-5 w-5 text-primary" />
					<h4 className="font-semibold">طلبية المصنع - حديد التسليح</h4>
				</div>
				<BOQExportDropdown
					onExcelExport={() => exportFactoryOrder(factoryOrder, studyName)}
					onPrint={onPrint}
					label="تصدير"
				/>
			</div>

			<Card>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead className="text-right">القطر (مم)</TableHead>
								<TableHead className="text-right">طول السيخ (م)</TableHead>
								<TableHead className="text-right">عدد الأسياخ</TableHead>
								<TableHead className="text-right">الوزن (كجم)</TableHead>
								<TableHead className="text-right">الوزن (طن)</TableHead>
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
									<TableCell className="font-bold text-orange-600">
										{formatNumber(entry.weight / 1000, 3)}
									</TableCell>
								</TableRow>
							))}

							{/* Total row */}
							<TableRow className="bg-muted/50 font-bold border-t-2">
								<TableCell>الإجمالي</TableCell>
								<TableCell></TableCell>
								<TableCell>{totalBars}</TableCell>
								<TableCell>{formatNumber(totalWeight)}</TableCell>
								<TableCell className="text-orange-600 text-lg">
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
}: {
	cuttingDetails: CuttingDetailRow[];
	studyName?: string;
	onPrint: () => void;
}) {
	if (cuttingDetails.length === 0) {
		return (
			<Card className="p-8 text-center text-muted-foreground">
				<Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
				<p>لا توجد تفاصيل تفصيل</p>
				<p className="text-xs mt-1">أضف عناصر إنشائية مع بيانات التسليح أولاً</p>
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
					<h4 className="font-semibold">تفاصيل التفصيل - ورشة القص</h4>
				</div>
				<BOQExportDropdown
					onExcelExport={() => exportCuttingDetails(cuttingDetails, studyName)}
					onPrint={onPrint}
					label="تصدير"
				/>
			</div>

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
									{group.length} عملية قص
								</span>
							</div>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<span>{groupStocks} سيخ مصنع</span>
								<span className="font-medium text-orange-600">
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
						<TableHead className="text-right text-xs">العنصر</TableHead>
						<TableHead className="text-right text-xs">الوصف</TableHead>
						<TableHead className="text-right text-xs">طول القطعة (م)</TableHead>
						<TableHead className="text-right text-xs">العدد</TableHead>
						<TableHead className="text-right text-xs">أسياخ المصنع</TableHead>
						<TableHead className="text-right text-xs">الهالك %</TableHead>
						<TableHead className="text-right text-xs">الوزن (كجم)</TableHead>
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
											? "text-red-600 font-medium"
											: d.wastePercentage > 8
												? "text-amber-600"
												: "text-green-600"
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
