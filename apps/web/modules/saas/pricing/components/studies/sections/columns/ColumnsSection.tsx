"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
import { calculateColumnRebar } from "../../../../lib/structural-calculations";
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
	const [repeatedCount, setRepeatedCount] = useState(3);
	const [expandedRepeatedFloors, setExpandedRepeatedFloors] = useState<
		number[]
	>([]);
	const [neckEnabled, setNeckEnabled] = useState(false);
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

	// فلترة عناصر الرقاب القديمة (الرقاب الآن محسوبة تلقائياً)
	const activeItems = useMemo(
		() => items.filter((i) => !i.subCategory?.endsWith("_neck")),
		[items],
	);

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
	const repeatedTemplateItems = getFloorItems("repeated");

	// حساب إجمالي الرقاب
	const neckTotals = useMemo(() => {
		if (!neckEnabled || groundColumns.length === 0)
			return { concrete: 0, steel: 0 };
		let concrete = 0;
		let steel = 0;
		groundColumns.forEach((col) => {
			const calc = calculateColumnRebar({
				quantity: col.quantity,
				width: col.dimensions?.width || 30,
				depth: col.dimensions?.depth || 30,
				height: neckHeight,
				mainBarsCount: col.dimensions?.mainBarsCount || 8,
				mainBarDiameter: col.dimensions?.mainBarDiameter || 16,
				stirrupDiameter: col.dimensions?.stirrupDiameter || 8,
				stirrupSpacing: col.dimensions?.stirrupSpacing || 150,
				concreteType: specs?.concreteType || "C35",
			});
			concrete += calc.concreteVolume;
			steel += calc.totals.grossWeight;
		});
		return { concrete, steel };
	}, [neckEnabled, groundColumns, neckHeight, specs]);

	// حساب الإجمالي الحقيقي
	const nonRepeatedActive = activeItems.filter(
		(i) => i.subCategory !== "repeated",
	);
	const repeatedConcrete =
		repeatedTemplateItems.reduce((s, i) => s + i.concreteVolume, 0) *
		repeatedCount;
	const repeatedSteel =
		repeatedTemplateItems.reduce((s, i) => s + i.steelWeight, 0) *
		repeatedCount;
	const grandTotalConcrete =
		nonRepeatedActive.reduce((s, i) => s + i.concreteVolume, 0) +
		repeatedConcrete +
		neckTotals.concrete;
	const grandTotalSteel =
		nonRepeatedActive.reduce((s, i) => s + i.steelWeight, 0) +
		repeatedSteel +
		neckTotals.steel;

	return (
		<div className="space-y-3">
			{/* أقسام الأدوار */}
			{FLOORS.map((floor) => {
				const floorItems = getFloorItems(floor.id);
				const isExpanded = expandedFloors.includes(floor.id);
				const hasItems = floorItems.length > 0;

				const displayConcrete = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.concreteVolume, 0) *
						repeatedCount
					: floorItems.reduce((s, i) => s + i.concreteVolume, 0);
				const displaySteel = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.steelWeight, 0) * repeatedCount
					: floorItems.reduce((s, i) => s + i.steelWeight, 0);

				return (
					<div
						key={floor.id}
						className={`border rounded-lg overflow-hidden transition-all ${
							hasItems
								? "border-blue-200/50 bg-blue-50/20 dark:bg-blue-950/10"
								: "border-border"
						} ${floor.isRepeated && hasItems ? "border-purple-300/50 bg-purple-50/20 dark:bg-purple-950/10" : ""}`}
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
										className="bg-purple-600 text-xs"
									>
										{repeatedCount} أدوار
									</Badge>
								)}
								{floor.id === "ground" && neckEnabled && (
									<Badge
										variant="secondary"
										className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
									>
										+ رقاب
									</Badge>
								)}
								{hasItems && (
									<Badge variant="secondary" className="text-xs">
										{floorItems.length} عنصر
									</Badge>
								)}
							</div>
							{hasItems && (
								<div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
									{displayConcrete > 0 && (
										<span>
											خرسانة:{" "}
											<span className="font-semibold text-blue-600">
												{formatNumber(displayConcrete)} م³
											</span>
										</span>
									)}
									{displaySteel > 0 && (
										<span>
											حديد:{" "}
											<span className="font-semibold text-orange-600">
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
										/>

										{/* قسم الرقاب */}
										{neckEnabled ? (
											<NeckColumnsSection
												groundColumns={groundColumns}
												neckHeight={neckHeight}
												onNeckHeightChange={setNeckHeight}
												onDisable={() => setNeckEnabled(false)}
												specs={specs}
											/>
										) : (
											floorItems.length > 0 && (
												<Button
													variant="outline"
													className="w-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border-2 border-dashed border-amber-400/40 hover:bg-amber-500/20 hover:border-amber-400/60 transition-all"
													onClick={() => setNeckEnabled(true)}
												>
													<Plus className="h-5 w-5 ml-2" />
													<span className="font-semibold">
														إضافة رقاب الأعمدة
													</span>
													<span className="text-xs mr-2 text-amber-600/70 dark:text-amber-500/70">
														(الجزء المدفون تحت الأرض)
													</span>
												</Button>
											)
										)}
									</div>
								) : floor.isRepeated ? (
									/* ═══ الدور المتكرر: خاص ═══ */
									<div className="space-y-4">
										{/* إعداد عدد الأدوار */}
										<div className="flex items-center gap-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 rounded-lg p-3">
											<Layers className="h-5 w-5 text-purple-600" />
											<Label className="font-medium text-sm">
												عدد الأدوار المتكررة:
											</Label>
											<Input
												type="number"
												min={1}
												max={50}
												value={repeatedCount}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													setRepeatedCount(
														Math.max(1, parseInt(e.target.value) || 1),
													)
												}
												className="w-20 h-8 text-center font-bold"
											/>
											<span className="text-xs text-muted-foreground">
												أضف الأعمدة مرة واحدة وسيتم تطبيقها على{" "}
												{repeatedCount} أدوار
											</span>
										</div>

										{/* قالب الأعمدة */}
										<div className="border border-purple-200/30 rounded-lg p-3">
											<div className="flex items-center gap-2 mb-3">
												<Copy className="h-4 w-4 text-purple-600" />
												<h5 className="font-medium text-sm">
													قالب الأعمدة (يُطبق على كل دور)
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
											/>
										</div>

										{/* عرض كل دور متكرر بالتفصيل */}
										{floorItems.length > 0 && (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-purple-600" />
													<h5 className="font-medium text-sm">
														تفصيل الأدوار المتكررة
													</h5>
												</div>
												{Array.from(
													{ length: repeatedCount },
													(_, i) => {
														const floorNum = i + 1;
														const isOpen =
															expandedRepeatedFloors.includes(i);
														const perFloorConcrete = floorItems.reduce(
															(s, item) => s + item.concreteVolume,
															0,
														);
														const perFloorSteel = floorItems.reduce(
															(s, item) => s + item.steelWeight,
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
																			الدور المتكرر {floorNum}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{floorItems.length} عنصر
																		</Badge>
																	</div>
																	<div className="flex items-center gap-3 text-xs text-muted-foreground">
																		<span>
																			خرسانة:{" "}
																			<span className="font-semibold text-blue-600">
																				{formatNumber(perFloorConcrete)} م³
																			</span>
																		</span>
																		<span>
																			حديد:{" "}
																			<span className="font-semibold text-orange-600">
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
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.itemName",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.quantity",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.form.dimensions",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
																						{t(
																							"pricing.studies.structural.concreteVolume",
																						)}
																					</TableHead>
																					<TableHead className="text-right text-xs">
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
																							{item.quantity}
																						</TableCell>
																						<TableCell className="text-sm">
																							{item.dimensions?.width || 0}×
																							{item.dimensions?.depth || 0} سم
																							×{" "}
																							{item.dimensions?.height || 0} م
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(
																								item.concreteVolume,
																							)}{" "}
																							م³
																						</TableCell>
																						<TableCell className="text-sm">
																							{formatNumber(item.steelWeight)}{" "}
																							كجم
																						</TableCell>
																					</TableRow>
																				))}
																			</TableBody>
																		</Table>
																		<div className="bg-muted/30 rounded p-2 mt-2 flex gap-4 text-xs">
																			<span>
																				إجمالي الدور {floorNum}:{" "}
																			</span>
																			<span className="font-bold text-blue-600">
																				{formatNumber(perFloorConcrete)} م³
																				خرسانة
																			</span>
																			<span className="font-bold text-orange-600">
																				{formatNumber(perFloorSteel)} كجم
																				حديد
																			</span>
																		</div>
																	</div>
																)}
															</div>
														);
													},
												)}

												{/* ملخص جميع الأدوار المتكررة */}
												<div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 rounded-lg p-3">
													<div className="flex items-center justify-between">
														<span className="font-semibold text-sm flex items-center gap-2">
															<Layers className="h-4 w-4 text-purple-600" />
															إجمالي {repeatedCount} أدوار متكررة
														</span>
														<div className="flex gap-4 text-sm">
															<span>
																خرسانة:{" "}
																<span className="font-bold text-blue-600">
																	{formatNumber(repeatedConcrete)} م³
																</span>
															</span>
															<span>
																حديد:{" "}
																<span className="font-bold text-orange-600">
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
						<h4 className="font-semibold">إجمالي جميع الأدوار</h4>
						{repeatedCount > 1 && repeatedTemplateItems.length > 0 && (
							<span className="text-xs text-muted-foreground">
								(يشمل {repeatedCount} أدوار متكررة)
							</span>
						)}
						{neckEnabled && groundColumns.length > 0 && (
							<span className="text-xs text-muted-foreground">
								(يشمل رقاب الأعمدة)
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
