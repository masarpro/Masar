"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import {
	Plus,
	Save,
	Calculator,
	X,
	ChevronDown,
	Package,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import {
	calculateMortar,
	calculateLintels,
	calculateBlockCount,
} from "../../../../lib/structural-calculations";
import { formatNumber } from "../../../../lib/utils";
import { BLOCK_TYPES, WALL_CATEGORIES, WASTE_PERCENTAGES } from "../../../../constants/blocks";
import type { StructuralItemCreateInput, StructuralItemUpdateInput } from "../../../../types/structural-mutation";
import type { BlockFormProps, EnhancedBlockResult, Opening } from "./types";
import {
	CLASSIFICATIONS_NEEDING_FLOOR,
	BLOCK_PRICES,
	MORTAR_PRICE,
	LINTEL_CONCRETE_PRICE,
	LINTEL_REBAR_PRICE,
	LABOR_PRICE_PER_SQM,
} from "./types";

export function BlockForm({
	isFloorScoped,
	floorLabel,
	editingItem,
	onSave: onFormSave,
	onCancel,
	studyId,
	organizationId,
	items,
	editingItemId,
	onSaveCallback,
	onUpdateCallback,
	derivedBlockHeight,
}: BlockFormProps) {
	const t = useTranslations();
	const [showDetails, setShowDetails] = useState(false);

	const defaultHeight = derivedBlockHeight != null && derivedBlockHeight > 0
		? derivedBlockHeight / 100 // cm -> m
		: 0;

	const [formData, setFormData] = useState(() => {
		if (editingItem) {
			return {
				name: editingItem.name,
				floor: isFloorScoped ? (floorLabel || "") : "",
				length: editingItem.dimensions?.length || 0,
				height: editingItem.dimensions?.height || 0,
				thickness: (editingItem.dimensions?.thickness || 20) as 10 | 15 | 20 | 25 | 30,
				blockType: (String(editingItem.dimensions?.blockType || "hollow")) as keyof typeof BLOCK_TYPES,
				wallCategory: (String(editingItem.dimensions?.wallCategory || "")) as keyof typeof WALL_CATEGORIES | "",
				hasLintel: true,
				openings: [] as Opening[],
			};
		}
		return {
			name: "",
			floor: isFloorScoped ? (floorLabel || "") : "",
			length: 0,
			height: defaultHeight,
			thickness: 20 as 10 | 15 | 20 | 25 | 30,
			blockType: "hollow" as keyof typeof BLOCK_TYPES,
			wallCategory: "" as keyof typeof WALL_CATEGORIES | "",
			hasLintel: true,
			openings: [] as Opening[],
		};
	});

	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemCreated"));
				onFormSave();
				onSaveCallback();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemCreateError"));
			},
		})
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.structuralItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemUpdated"));
				onFormSave();
				onUpdateCallback();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemUpdateError"));
			},
		})
	);

	// توليد اسم البلوك تلقائيا حسب التصنيف والدور
	const getBlockAutoName = (classification: string, floor: string): string => {
		if (!classification) return '';
		const classNameAr = WALL_CATEGORIES[classification as keyof typeof WALL_CATEGORIES]?.nameAr || classification;

		// تصنيفات بدون دور — الاسم هو التصنيف نفسه
		if (!CLASSIFICATIONS_NEEDING_FLOOR.includes(classification)) {
			const existingCount = items.filter(item => item.name?.startsWith(classNameAr) && item.id !== editingItemId).length;
			return existingCount > 0 ? `${classNameAr} ${existingCount + 1}` : classNameAr;
		}

		// تصنيفات تحتاج دور
		if (!floor) return classNameAr;

		let baseName: string;
		if (floor === 'ميزانين') {
			baseName = `${classNameAr} دور الميزانين`;
		} else {
			baseName = `${classNameAr} الدور ال${floor}`;
		}

		const existingCount = items.filter(item => item.name?.startsWith(baseName) && item.id !== editingItemId).length;
		return existingCount > 0 ? `${baseName} ${existingCount + 1}` : baseName;
	};

	const needsFloor = isFloorScoped;
	const canProceed = !!formData.wallCategory && (!needsFloor || !!formData.floor);

	// Filter categories based on isFloorScoped
	const filteredCategories = useMemo(() => {
		return Object.entries(WALL_CATEGORIES).filter(([key]) => {
			if (isFloorScoped) {
				return CLASSIFICATIONS_NEEDING_FLOOR.includes(key);
			}
			return !CLASSIFICATIONS_NEEDING_FLOOR.includes(key);
		});
	}, [isFloorScoped]);

	// حساب النتائج المحسنة
	const calculations = useMemo((): EnhancedBlockResult | null => {
		if (formData.length <= 0 || formData.height <= 0) return null;

		const grossArea = formData.length * formData.height;
		const openingsArea = formData.openings.reduce(
			(sum, o) => sum + o.width * o.height * o.quantity,
			0
		);
		const netArea = Math.max(0, grossArea - openingsArea);

		// حساب البلوك
		const blocksPerSqm = 12.5;
		const wastePercentage = WASTE_PERCENTAGES.blocks.standard;
		const blockCalc = calculateBlockCount(netArea, blocksPerSqm, wastePercentage);
		const blockPrice = BLOCK_PRICES[formData.thickness] || 3.5;
		const blocksCost = blockCalc.grossCount * blockPrice;

		// حساب المونة
		const mortarCalc = calculateMortar(netArea);
		const mortarCost = mortarCalc.totalVolume * MORTAR_PRICE;

		// حساب الاعتاب
		let lintelsCalc = null;
		let lintelsCost = 0;
		if (formData.hasLintel && formData.openings.length > 0) {
			const openingsForLintels = formData.openings.map((o, idx) => ({
				id: `opening-${idx}`,
				name: `${o.type}-${idx + 1}`,
				width: o.width,
				height: o.height,
				quantity: o.quantity,
				type: o.type as "door" | "window",
				area: o.width * o.height * o.quantity,
			}));
			const lintelResult = calculateLintels(openingsForLintels, 0.20, formData.thickness);
			if (lintelResult) {
				lintelsCalc = lintelResult;
				lintelsCost = lintelResult.concreteVolume * LINTEL_CONCRETE_PRICE +
					lintelResult.rebarWeight * LINTEL_REBAR_PRICE;
			}
		}

		// حساب العمالة
		const laborCost = netArea * LABOR_PRICE_PER_SQM;

		const totalCost = blocksCost + mortarCost + lintelsCost + laborCost;

		return {
			grossArea,
			openingsArea,
			netArea,
			blocks: {
				count: blockCalc.netCount,
				wasteCount: blockCalc.wasteCount,
				totalCount: blockCalc.grossCount,
				wastePercentage,
				pricePerBlock: blockPrice,
				totalCost: blocksCost,
			},
			mortar: {
				volume: mortarCalc.totalVolume,
				cementBags: mortarCalc.cementBags,
				sandVolume: mortarCalc.sandVolume,
				cost: mortarCost,
			},
			lintels: lintelsCalc ? {
				count: lintelsCalc.count,
				totalLength: lintelsCalc.totalLength,
				concreteVolume: lintelsCalc.concreteVolume,
				rebarWeight: lintelsCalc.rebarWeight,
				cost: lintelsCost,
			} : null,
			costs: {
				blocks: blocksCost,
				mortar: mortarCost,
				lintels: lintelsCost,
				labor: laborCost,
				total: totalCost,
			},
		};
	}, [formData]);

	const handleSubmit = async () => {
		if (!formData.name || !formData.wallCategory || (needsFloor && !formData.floor) || !calculations) return;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "blocks",
			subCategory: formData.wallCategory,
			name: formData.name,
			quantity: calculations.blocks.totalCount,
			unit: "piece",
			dimensions: {
				length: formData.length,
				height: formData.height,
				thickness: formData.thickness,
				floor: isFloorScoped ? (floorLabel || "") : "",
				blockType: formData.blockType,
				wallCategory: formData.wallCategory,
			},
			concreteVolume: calculations.lintels?.concreteVolume || 0,
			steelWeight: calculations.lintels?.rebarWeight || 0,
			materialCost: calculations.costs.blocks + calculations.costs.mortar + calculations.costs.lintels,
			laborCost: calculations.costs.labor,
			totalCost: calculations.costs.total,
		};

		if (editingItemId) {
			(updateMutation.mutate as (data: StructuralItemUpdateInput) => void)({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			(createMutation.mutate as (data: StructuralItemCreateInput) => void)(itemData);
		}
	};

	const addOpening = (type: "door" | "window") => {
		const newOpening: Opening = {
			id: `opening-${Date.now()}`,
			type,
			width: type === "door" ? 1.0 : 1.2,
			height: type === "door" ? 2.1 : 1.2,
			quantity: 1,
		};
		setFormData({
			...formData,
			openings: [...formData.openings, newOpening],
		});
	};

	const removeOpening = (id: string) => {
		setFormData({
			...formData,
			openings: formData.openings.filter((o) => o.id !== id),
		});
	};

	const updateOpening = (id: string, field: keyof Opening, value: number | string) => {
		setFormData({
			...formData,
			openings: formData.openings.map((o) =>
				o.id === id ? { ...o, [field]: value } : o
			),
		});
	};

	return (
		<Card className="border-dashed border-2 border-primary/50">
			<CardContent className="p-4 space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium">
						{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
					</h4>
					<Button variant="ghost" size="icon" onClick={onCancel}>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* البيانات الاساسية */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<div>
						<Label>تصنيف الجدار <span className="text-destructive">*</span></Label>
						<Select
							value={formData.wallCategory || undefined}
							onValueChange={(v: string) => {
								const wc = v as keyof typeof WALL_CATEGORIES;
								const newFloor = isFloorScoped ? (floorLabel || "") : "";
								setFormData({
									...formData,
									wallCategory: wc,
									floor: newFloor,
									name: getBlockAutoName(wc, newFloor),
								});
							}}
						>
							<SelectTrigger className={!formData.wallCategory ? "border-destructive ring-destructive/30 ring-2" : ""}>
								<SelectValue placeholder="اختر التصنيف" />
							</SelectTrigger>
							<SelectContent>
								{filteredCategories.map(([key, value]) => (
									<SelectItem key={key} value={key}>
										{value.nameAr}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{isFloorScoped && (
						<div>
							<Label>الدور</Label>
							<div className="mt-1">
								<Badge variant="secondary" className="text-sm px-3 py-1.5">
									{floorLabel}
								</Badge>
							</div>
						</div>
					)}

					<div>
						<Label>{t("pricing.studies.structural.itemName")}</Label>
						<Input
							placeholder="اختر التصنيف"
							value={formData.name}
							onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
							className="font-bold"
						/>
					</div>

					<div>
						<Label>{t("pricing.studies.structural.thickness")} ({t("pricing.studies.units.cm")})</Label>
						<Select
							value={formData.thickness.toString()}
							onValueChange={(v: any) =>
								setFormData({ ...formData, thickness: +v as 10 | 15 | 20 | 25 | 30 })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10 سم</SelectItem>
								<SelectItem value="15">15 سم</SelectItem>
								<SelectItem value="20">20 سم</SelectItem>
								<SelectItem value="25">25 سم</SelectItem>
								<SelectItem value="30">30 سم</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>نوع البلوك</Label>
						<Select
							value={formData.blockType}
							onValueChange={(v: keyof typeof BLOCK_TYPES) =>
								setFormData({ ...formData, blockType: v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(BLOCK_TYPES).map(([key, value]) => (
									<SelectItem key={key} value={key}>
										{value.nameAr}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* رسالة المتابعة */}
				{!canProceed && (
					<div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
						<p className="text-sm font-medium">
							يرجى اختيار تصنيف الجدار للمتابعة
						</p>
					</div>
				)}

				{/* ابعاد الجدار والتفاصيل */}
				{canProceed && (<>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div>
						<Label>{t("pricing.studies.structural.length")} ({t("pricing.studies.units.m")})</Label>
						<Input
							type="number"
							step="0.1"
							min={0}
							value={formData.length || ""}
							onChange={(e: any) =>
								setFormData({ ...formData, length: +e.target.value })
							}
						/>
					</div>
					<div>
						<Label>
							{t("pricing.studies.structural.height")} ({t("pricing.studies.units.m")})
							{derivedBlockHeight != null && (
								<span className="text-xs text-green-600 mr-1">(محسوب)</span>
							)}
						</Label>
						<Input
							type="number"
							step="0.1"
							min={0}
							value={formData.height || ""}
							onChange={(e: any) =>
								setFormData({ ...formData, height: +e.target.value })
							}
						/>
					</div>
					<div className="bg-muted/50 rounded p-2 flex flex-col justify-center">
						<span className="text-xs text-muted-foreground">المساحة الإجمالية</span>
						<span className="font-bold">
							{formatNumber(formData.length * formData.height)} م²
						</span>
					</div>
				</div>

				{/* الفتحات */}
				<div className="border rounded-lg p-4 bg-amber-50/30">
					<div className="flex items-center justify-between mb-3">
						<h5 className="font-medium">الفتحات (الأبواب والنوافذ)</h5>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => addOpening("door")}
							>
								<Plus className="h-3 w-3 ml-1" />
								باب
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => addOpening("window")}
							>
								<Plus className="h-3 w-3 ml-1" />
								نافذة
							</Button>
						</div>
					</div>
					{formData.openings.length > 0 ? (
						<div className="space-y-2">
							{formData.openings.map((opening) => (
								<div
									key={opening.id}
									className="flex items-center gap-3 bg-background rounded p-2"
								>
									<Badge variant={opening.type === "door" ? "default" : "secondary"}>
										{opening.type === "door" ? "باب" : "نافذة"}
									</Badge>
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">العرض:</span>
										<Input
											type="number"
											step="0.1"
											className="w-20 h-8"
											value={opening.width}
											onChange={(e: any) =>
												updateOpening(opening.id, "width", +e.target.value)
											}
										/>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">الارتفاع:</span>
										<Input
											type="number"
											step="0.1"
											className="w-20 h-8"
											value={opening.height}
											onChange={(e: any) =>
												updateOpening(opening.id, "height", +e.target.value)
											}
										/>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">العدد:</span>
										<Input
											type="number"
											min={1}
											className="w-16 h-8"
											value={opening.quantity}
											onChange={(e: any) =>
												updateOpening(opening.id, "quantity", +e.target.value)
											}
										/>
									</div>
									<span className="text-xs text-muted-foreground">
										= {formatNumber(opening.width * opening.height * opening.quantity)} م²
									</span>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => removeOpening(opening.id)}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							))}
							<div className="flex items-center gap-2 pt-2 border-t">
								<input
									type="checkbox"
									id={`hasLintel-${isFloorScoped ? floorLabel : "general"}`}
									checked={formData.hasLintel}
									onChange={(e: any) =>
										setFormData({ ...formData, hasLintel: e.target.checked })
									}
									className="rounded"
								/>
								<Label htmlFor={`hasLintel-${isFloorScoped ? floorLabel : "general"}`} className="text-sm">
									إضافة أعتاب خرسانية فوق الفتحات
								</Label>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">
							لا توجد فتحات - أضف أبواب أو نوافذ إن وجدت
						</p>
					)}
				</div>

				{/* نتائج الحساب */}
				{calculations && (
					<div className="bg-muted/50 rounded-lg p-4 space-y-4">
						<div className="flex items-center gap-2 mb-3">
							<Calculator className="h-5 w-5 text-primary" />
							<h4 className="font-medium">{t("pricing.studies.calculations.results")}</h4>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">المساحة الصافية:</span>
								<p className="font-bold text-lg">
									{formatNumber(calculations.netArea)} {t("pricing.studies.units.m2")}
								</p>
							</div>
							<div>
								<span className="text-muted-foreground">
									{t("pricing.studies.structural.quantity")}:
								</span>
								<p className="font-bold text-lg">
									{calculations.blocks.totalCount} بلوكة
								</p>
							</div>
							<div>
								<span className="text-muted-foreground">أكياس الأسمنت:</span>
								<p className="font-bold text-lg">
									{calculations.mortar.cementBags} كيس
								</p>
							</div>
						</div>

						{/* تفاصيل اضافية */}
						<Collapsible
							open={showDetails}
							onOpenChange={setShowDetails}
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-between"
									size="sm"
								>
									<span className="flex items-center gap-2">
										<Layers className="h-4 w-4" />
										تفاصيل الكميات
									</span>
									<ChevronDown
										className={`h-4 w-4 transition-transform ${
											showDetails ? "rotate-180" : ""
										}`}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-3 space-y-3">
								{/* تفاصيل البلوك */}
								<div className="bg-background rounded p-3">
									<h6 className="font-medium text-sm mb-2 flex items-center gap-2">
										<Package className="h-4 w-4" />
										تفاصيل البلوك
									</h6>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
										<div>
											<span className="text-muted-foreground">البلوك الصافي:</span>
											<p className="font-medium">{calculations.blocks.count} بلوكة</p>
										</div>
										<div>
											<span className="text-muted-foreground">هالك ({calculations.blocks.wastePercentage}%):</span>
											<p className="font-medium">{calculations.blocks.wasteCount} بلوكة</p>
										</div>
										<div>
											<span className="text-muted-foreground">إجمالي البلوك:</span>
											<p className="font-medium">{calculations.blocks.totalCount} بلوكة</p>
										</div>
									</div>
								</div>

								{/* تفاصيل المونة */}
								<div className="bg-background rounded p-3">
									<h6 className="font-medium text-sm mb-2">تفاصيل المونة</h6>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
										<div>
											<span className="text-muted-foreground">حجم المونة:</span>
											<p className="font-medium">{formatNumber(calculations.mortar.volume)} م³</p>
										</div>
										<div>
											<span className="text-muted-foreground">أكياس الأسمنت:</span>
											<p className="font-medium">{calculations.mortar.cementBags} كيس</p>
										</div>
										<div>
											<span className="text-muted-foreground">حجم الرمل:</span>
											<p className="font-medium">{formatNumber(calculations.mortar.sandVolume)} م³</p>
										</div>
									</div>
								</div>

								{/* تفاصيل الاعتاب */}
								{calculations.lintels && (
									<div className="bg-background rounded p-3">
										<h6 className="font-medium text-sm mb-2">تفاصيل الأعتاب</h6>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
											<div>
												<span className="text-muted-foreground">عدد الأعتاب:</span>
												<p className="font-medium">{calculations.lintels.count} عتب</p>
											</div>
											<div>
												<span className="text-muted-foreground">الطول الكلي:</span>
												<p className="font-medium">{formatNumber(calculations.lintels.totalLength)} م</p>
											</div>
											<div>
												<span className="text-muted-foreground">حجم الخرسانة:</span>
												<p className="font-medium">{formatNumber(calculations.lintels.concreteVolume)} م³</p>
											</div>
											<div>
												<span className="text-muted-foreground">وزن الحديد:</span>
												<p className="font-medium">{formatNumber(calculations.lintels.rebarWeight)} كجم</p>
											</div>
										</div>
									</div>
								)}

								{/* ملخص الفتحات */}
								{calculations.openingsArea > 0 && (
									<div className="bg-blue-50 rounded p-3">
										<h6 className="font-medium text-sm mb-2">ملخص الفتحات</h6>
										<div className="flex flex-wrap gap-2">
											<Badge variant="outline" className="bg-white">
												المساحة الإجمالية: {formatNumber(calculations.grossArea)} م²
											</Badge>
											<Badge variant="outline" className="bg-white">
												مساحة الفتحات: {formatNumber(calculations.openingsArea)} م²
											</Badge>
											<Badge variant="outline" className="bg-white">
												المساحة الصافية: {formatNumber(calculations.netArea)} م²
											</Badge>
										</div>
									</div>
								)}
							</CollapsibleContent>
						</Collapsible>
					</div>
				)}

				</>)}

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onCancel}>
						{t("pricing.studies.form.cancel")}
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !formData.wallCategory || (needsFloor && !formData.floor) || !calculations}
					>
						<Save className="h-4 w-4 ml-2" />
						{editingItemId ? t("pricing.studies.structural.updateItem") : t("pricing.studies.structural.saveItem")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
