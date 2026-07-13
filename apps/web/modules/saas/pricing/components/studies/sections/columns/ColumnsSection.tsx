"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Plus,
	ChevronDown,
	ChevronLeft,
	Building2,
	Copy,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../../../lib/utils";
import { useHeightDerivation } from "../../../../hooks/useHeightDerivation";
import { FloorColumnsPanel } from "./FloorColumnsPanel";
import { NeckColumnsSection } from "./NeckColumnsSection";
import { CopyFromFloorButton } from "./CopyFromFloorButton";
import { DEFAULT_FLOORS } from "./types";
import type { ColumnsSectionProps, FloorDef } from "./types";

export function ColumnsSection({
	studyId,
	organizationId,
	items,
	allItems,
	onSave,
	onUpdate,
	specs,
	buildingFloors,
	buildingConfig,
}: ColumnsSectionProps) {
	const { derivedHeights, getColumnHeight, getNeckHeight } = useHeightDerivation(buildingConfig ?? null, allItems);

	const FLOORS: FloorDef[] = buildingFloors
		? buildingFloors
			.filter((f) => f.enabled)
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((f) => ({
				id: f.id,
				label: f.label,
				icon: f.icon,
				hasNeckColumns: f.hasNeckColumns,
				isRepeated: f.isRepeated,
			}))
		: DEFAULT_FLOORS;
	const t = useTranslations();
	const [expandedFloors, setExpandedFloors] = useState<string[]>(["ground"]);
	// عدد تكرارات الدور المتكرر — يُقرأ من معالج التهيئة (وليس حالة محلية)
	// حتى تتطابق القيم المخزنة مع BOQ والتسعير
	const repeatedCount = Math.max(
		1,
		buildingFloors?.find((f) => f.enabled && f.isRepeated)?.repeatCount ??
			buildingConfig?.floors.find((f) => f.enabled && f.isRepeated)
				?.repeatCount ??
			1,
	);
	const [expandedRepeatedFloors, setExpandedRepeatedFloors] = useState<
		number[]
	>([]);
	const [neckEnabledOverride, setNeckEnabledOverride] = useState<
		boolean | null
	>(null);
	const derivedNeck = getNeckHeight();
	const [neckHeight, setNeckHeight] = useState(() => {
		if (derivedNeck != null && derivedNeck > 0) return derivedNeck / 100; // cm → m
		return 1;
	});

	const toggleFloor = (floorId: string) => {
		setExpandedFloors((prev) =>
			prev.includes(floorId)
				? prev.filter((f) => f !== floorId)
				: [...prev, floorId],
		);
	};

	const toggleRepeatedFloor = (index: number) => {
		setExpandedRepeatedFloors((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index],
		);
	};

	// عناصر الأعمدة (بدون الرقاب) — الرقاب تُدار كعناصر منفصلة subCategory = `${floorId}_neck`
	const activeItems = useMemo(
		() => items.filter((i) => !i.subCategory?.endsWith("_neck")),
		[items],
	);

	// عناصر الرقاب المحفوظة — وجودها يعني أن قسم الرقاب مفعّل
	const neckItems = useMemo(
		() => items.filter((i) => i.subCategory?.endsWith("_neck")),
		[items],
	);
	const neckEnabled = neckEnabledOverride ?? neckItems.length > 0;

	// العناصر حسب الدور
	const getFloorItems = (floorId: string) => {
		const floorItems = activeItems.filter((i) => i.subCategory === floorId);
		if (floorId === "ground") {
			const allFloorIds = FLOORS.map((f) => f.id);
			const unassigned = activeItems.filter(
				(i) =>
					!i.subCategory ||
					!allFloorIds.some((fid) => i.subCategory === fid),
			);
			return [...floorItems, ...unassigned];
		}
		return floorItems;
	};

	const groundColumns = getFloorItems("ground");
	const repeatedFloorId = FLOORS.find((f) => f.isRepeated)?.id ?? "repeated";
	const repeatedTemplateItems = getFloorItems(repeatedFloorId);

	// إجمالي الرقاب من العناصر المحفوظة (تصل الآن إلى BOQ والتسعير)
	const neckTotals = useMemo(
		() => ({
			concrete: neckItems.reduce((s, i) => s + i.concreteVolume, 0),
			steel: neckItems.reduce((s, i) => s + i.steelWeight, 0),
		}),
		[neckItems],
	);

	// الإجمالي الحقيقي — القيم المخزنة شاملة للتكرارات، فالجمع مباشر بلا ضرب
	const repeatedConcrete = repeatedTemplateItems.reduce(
		(s, i) => s + i.concreteVolume,
		0,
	);
	const repeatedSteel = repeatedTemplateItems.reduce(
		(s, i) => s + i.steelWeight,
		0,
	);
	const grandTotalConcrete =
		activeItems.reduce((s, i) => s + i.concreteVolume, 0) +
		neckTotals.concrete;
	const grandTotalSteel =
		activeItems.reduce((s, i) => s + i.steelWeight, 0) + neckTotals.steel;

	return (
		<div className="space-y-3">
			{/* أقسام الأدوار */}
			{FLOORS.map((floor) => {
				const floorItems = getFloorItems(floor.id);
				const isExpanded = expandedFloors.includes(floor.id);
				const hasItems = floorItems.length > 0;

				// القيم المخزنة شاملة للتكرارات — لا ضرب إضافي في العرض
				const displayConcrete = floorItems.reduce(
					(s, i) => s + i.concreteVolume,
					0,
				);
				const displaySteel = floorItems.reduce(
					(s, i) => s + i.steelWeight,
					0,
				);

				return (
					<div
						key={floor.id}
						className={`border rounded-lg overflow-hidden transition-all ${
							hasItems
								? "border-chart-4/50 bg-chart-4/15 dark:bg-chart-4/20"
								: "border-border"
						} ${floor.isRepeated && hasItems ? "border-chart-4/30 bg-chart-4/10" : ""}`}
					>
						{/* رأس الدور */}
						<button
							type="button"
							className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
							onClick={() => toggleFloor(floor.id)}
						>
							<div className="flex items-center gap-3">
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronLeft className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="text-lg">{floor.icon}</span>
								<span className="font-semibold">{floor.label}</span>
								{floor.isRepeated && repeatedCount > 1 && (
									<Badge
										variant="default"
										className="bg-chart-4 text-xs"
									>
										{t("pricing.studies.structural.sections.columns.floorsCount", { count: repeatedCount })}
									</Badge>
								)}
								{floor.id === "ground" && neckEnabled && (
									<Badge
										variant="secondary"
										className="text-xs bg-chart-1/15 text-chart-1"
									>
										{t("pricing.studies.structural.sections.columns.plusNecks")}
									</Badge>
								)}
								{hasItems && (
									<Badge variant="secondary" className="text-xs">
										{t("pricing.studies.structural.sections.common.itemsCount", { count: floorItems.length })}
									</Badge>
								)}
							</div>
							{hasItems && (
								<div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
									{displayConcrete > 0 && (
										<span>
											{t("pricing.studies.structural.sections.common.concrete")}:{" "}
											<span className="font-semibold text-chart-4">
												{formatNumber(displayConcrete)} م³
											</span>
										</span>
									)}
									{displaySteel > 0 && (
										<span>
											{t("pricing.studies.structural.sections.common.steel")}:{" "}
											<span className="font-semibold text-chart-1">
												{formatNumber(displaySteel)} كجم
											</span>
										</span>
									)}
								</div>
							)}
						</button>

						{/* محتوى الدور */}
						{isExpanded && (
							<div className="px-4 pb-4">
								{floor.id === "ground" ? (
									/* ═══ الدور الأرضي: أعمدة + رقاب ═══ */
									<div className="space-y-4">
										<FloorColumnsPanel
											floor={floor}
											studyId={studyId}
											organizationId={organizationId}
											items={floorItems}
											specs={specs}
											onSave={onSave}
											onUpdate={onUpdate}
											allItemsCount={activeItems.length}
											derivedColumnHeight={getColumnHeight(floor.id)}
										/>
										<CopyFromFloorButton
											currentFloorId={floor.id}
											currentFloorLabel={floor.label}
											floors={FLOORS}
											getFloorItems={getFloorItems}
											studyId={studyId}
											organizationId={organizationId}
											specs={specs}
											onCopied={onSave}
											targetHeight={
												getColumnHeight(floor.id) != null &&
												(getColumnHeight(floor.id) as number) > 0
													? (getColumnHeight(floor.id) as number) / 100
													: null
											}
											targetRepeatCount={1}
										/>

										{/* قسم الرقاب */}
										{neckEnabled ? (
											<NeckColumnsSection
												groundColumns={groundColumns}
												neckHeight={neckHeight}
												onNeckHeightChange={setNeckHeight}
												onDisable={() => setNeckEnabledOverride(false)}
												specs={specs}
												studyId={studyId}
												organizationId={organizationId}
												floorId={floor.id}
												savedNeckItems={neckItems}
												onSaved={onSave}
											/>
										) : (
											floorItems.length > 0 && (
												<Button
													variant="outline"
													className="w-full bg-chart-1/10 text-chart-1 border-2 border-dashed border-chart-1/40 hover:bg-chart-1/20 hover:border-chart-1/60 transition-all"
													onClick={() => setNeckEnabledOverride(true)}
												>
													<Plus className="h-5 w-5 me-2" />
													<span className="font-semibold">
														{t("pricing.studies.structural.sections.columns.addNeckColumns")}
													</span>
													<span className="text-xs ms-2 text-chart-1/70">
														{t("pricing.studies.structural.sections.columns.neckHint")}
													</span>
												</Button>
											)
										)}
									</div>
								) : floor.isRepeated ? (
									/* ═══ الدور المتكرر: خاص ═══ */
									<div className="space-y-4">
										{/* عدد الأدوار المتكررة — قراءة فقط (من معالج التهيئة) */}
										<div className="flex items-center gap-3 bg-chart-4/10 border border-chart-4/30 rounded-lg p-3">
											<Layers className="h-5 w-5 text-chart-4" />
											<Label className="font-medium text-sm">
												{t("pricing.studies.structural.sections.columns.repeatedFloorsCount")}:
											</Label>
											<Badge
												variant="default"
												className="bg-chart-4 text-sm font-bold"
											>
												× {repeatedCount}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{t("pricing.studies.structural.sections.columns.repeatedHint", { count: repeatedCount })}
											</span>
										</div>

										{/* قالب الأعمدة */}
										<div className="border border-chart-4/30 rounded-lg p-3">
											<div className="flex items-center gap-2 mb-3">
												<Copy className="h-4 w-4 text-chart-4" />
												<h5 className="font-medium text-sm">
													{t("pricing.studies.structural.sections.columns.columnsTemplate")}
												</h5>
											</div>
											<FloorColumnsPanel
												floor={floor}
												studyId={studyId}
												organizationId={organizationId}
												items={floorItems}
												specs={specs}
												onSave={onSave}
												onUpdate={onUpdate}
												allItemsCount={activeItems.length}
												derivedColumnHeight={getColumnHeight(floor.id)}
												repeatCount={repeatedCount}
											/>
											<CopyFromFloorButton
												currentFloorId={floor.id}
												currentFloorLabel={floor.label}
												floors={FLOORS}
												getFloorItems={getFloorItems}
												studyId={studyId}
												organizationId={organizationId}
												specs={specs}
												onCopied={onSave}
												targetHeight={
													getColumnHeight(floor.id) != null &&
													(getColumnHeight(floor.id) as number) > 0
														? (getColumnHeight(floor.id) as number) / 100
														: null
												}
												targetRepeatCount={repeatedCount}
											/>
										</div>

										{/* عرض كل دور متكرر بالتفصيل */}
										{floorItems.length > 0 && (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-chart-4" />
													<h5 className="font-medium text-sm">
														{t("pricing.studies.structural.sections.columns.repeatedDetail")}
													</h5>
												</div>
												{Array.from(
													{ length: repeatedCount },
													(_, i) => {
														const floorNum = i + 1;
														const isOpen =
															expandedRepeatedFloors.includes(i);
														// القيم المخزنة شاملة للتكرارات — القسمة على repeatCount تعطي قيمة الدور الواحد
														const perFloorConcrete = floorItems.reduce(
															(s, item) =>
																s +
																item.concreteVolume /
																	(item.dimensions?.repeatCount || 1),
															0,
														);
														const perFloorSteel = floorItems.reduce(
															(s, item) =>
																s +
																item.steelWeight /
																	(item.dimensions?.repeatCount || 1),
															0,
														);

														return (
															<div
																key={i}
																className="border rounded-lg overflow-hidden bg-background"
															>
																<button
																	type="button"
																	className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors text-sm"
																	onClick={() => toggleRepeatedFloor(i)}
																>
																	<div className="flex items-center gap-2">
																		{isOpen ? (
																			<ChevronDown className="h-3 w-3 text-muted-foreground" />
																		) : (
																			<ChevronLeft className="h-3 w-3 text-muted-foreground" />
																		)}
																		<span className="font-medium">
																			{t("pricing.studies.structural.sections.columns.repeatedFloor", { number: floorNum })}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{t("pricing.studies.structural.sections.common.itemsCount", { count: floorItems.length })}
																		</Badge>
																	</div>
																	<div className="flex items-center gap-3 text-xs text-muted-foreground">
																		<span>
																			{t("pricing.studies.structural.sections.common.concrete")}:{" "}
																			<span className="font-semibold text-chart-4">
																				{formatNumber(perFloorConcrete)} م³
																			</span>
																		</span>
																		<span>
																			{t("pricing.studies.structural.sections.common.steel")}:{" "}
																			<span className="font-semibold text-chart-1">
																				{formatNumber(perFloorSteel)} كجم
																			</span>
																		</span>
																	</div>
																</button>
																{isOpen && (
																	<div className="px-3 pb-3 border-t">
																		<Table>
																			<TableHeader>
																				<TableRow>
																					<TableHead className="text-start text-xs">
																						{t(
																							"pricing.studies.structural.itemName",
																						)}
																					</TableHead>
																					<TableHead className="text-start text-xs">
																						{t(
																							"pricing.studies.structural.quantity",
																						)}
																					</TableHead>
																					<TableHead className="text-start text-xs">
																						{t(
																							"pricing.studies.form.dimensions",
																						)}
																					</TableHead>
																					<TableHead className="text-start text-xs">
																						{t(
																							"pricing.studies.structural.concreteVolume",
																						)}
																					</TableHead>
																					<TableHead className="text-start text-xs">
																						{t(
																							"pricing.studies.structural.steelWeight",
																						)}
																					</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				{floorItems.map((item) => (
																					<TableRow
																						key={`${item.id}-f${floorNum}`}
																					>
																						<TableCell className="text-sm">
																							{item.name}
																						</TableCell>
																						<TableCell className="text-sm">
																							{item.dimensions
																								?.perFloorQuantity ||
																								item.quantity}
																						</TableCell>
																						<TableCell className="text-sm">
																							{item.dimensions?.width || 0}×
																							{item.dimensions?.depth || 0} سم
																							×{" "}
																							{item.dimensions?.height || 0} م
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(
																								item.concreteVolume /
																									(item.dimensions
																										?.repeatCount || 1),
																							)}{" "}
																							م³
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(
																								item.steelWeight /
																									(item.dimensions
																										?.repeatCount || 1),
																							)}{" "}
																							كجم
																						</TableCell>
																					</TableRow>
																				))}
																			</TableBody>
																		</Table>
																		<div className="bg-muted/30 rounded p-2 mt-2 flex gap-4 text-xs">
																			<span>
																				{t("pricing.studies.structural.sections.columns.floorTotal", { number: floorNum })}:{" "}
																			</span>
																			<span className="font-bold text-chart-4">
																				{formatNumber(perFloorConcrete)} م³ {t("pricing.studies.structural.sections.common.concrete")}
																			</span>
																			<span className="font-bold text-chart-1">
																				{formatNumber(perFloorSteel)} كجم {t("pricing.studies.structural.sections.common.steel")}
																			</span>
																		</div>
																	</div>
																)}
															</div>
														);
													},
												)}

												{/* ملخص جميع الأدوار المتكررة */}
												<div className="bg-chart-4/10 border border-chart-4/30 rounded-lg p-3">
													<div className="flex items-center justify-between">
														<span className="font-semibold text-sm flex items-center gap-2">
															<Layers className="h-4 w-4 text-chart-4" />
															{t("pricing.studies.structural.sections.columns.repeatedTotal", { count: repeatedCount })}
														</span>
														<div className="flex gap-4 text-sm">
															<span>
																{t("pricing.studies.structural.sections.common.concrete")}:{" "}
																<span className="font-bold text-chart-4">
																	{formatNumber(repeatedConcrete)} م³
																</span>
															</span>
															<span>
																{t("pricing.studies.structural.sections.common.steel")}:{" "}
																<span className="font-bold text-chart-1">
																	{formatNumber(repeatedSteel)} كجم
																</span>
															</span>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								) : (
									/* ═══ الأدوار العادية ═══ */
									<div className="space-y-4">
										<FloorColumnsPanel
											floor={floor}
											studyId={studyId}
											organizationId={organizationId}
											items={floorItems}
											specs={specs}
											onSave={onSave}
											onUpdate={onUpdate}
											allItemsCount={activeItems.length}
											derivedColumnHeight={getColumnHeight(floor.id)}
										/>
										<CopyFromFloorButton
											currentFloorId={floor.id}
											currentFloorLabel={floor.label}
											floors={FLOORS}
											getFloorItems={getFloorItems}
											studyId={studyId}
											organizationId={organizationId}
											specs={specs}
											onCopied={onSave}
											targetHeight={
												getColumnHeight(floor.id) != null &&
												(getColumnHeight(floor.id) as number) > 0
													? (getColumnHeight(floor.id) as number) / 100
													: null
											}
											targetRepeatCount={1}
										/>
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* الملخص الإجمالي */}
			{activeItems.length > 0 && (
				<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-2">
						<Building2 className="h-5 w-5 text-primary" />
						<h4 className="font-semibold">{t("pricing.studies.structural.sections.columns.allFloorsTotal")}</h4>
						{repeatedCount > 1 && repeatedTemplateItems.length > 0 && (
							<span className="text-xs text-muted-foreground">
								{t("pricing.studies.structural.sections.columns.includesRepeated", { count: repeatedCount })}
							</span>
						)}
						{neckItems.length > 0 && (
							<span className="text-xs text-muted-foreground">
								{t("pricing.studies.structural.sections.columns.includesNecks")}
							</span>
						)}
					</div>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold text-lg">
								{formatNumber(grandTotalConcrete)}{" "}
								{t("pricing.studies.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalRebar")}:
							</span>
							<p className="font-bold text-lg">
								{formatNumber(grandTotalSteel)}{" "}
								{t("pricing.studies.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
