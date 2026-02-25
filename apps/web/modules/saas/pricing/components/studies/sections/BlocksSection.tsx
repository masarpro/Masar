"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
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
	Trash2,
	Pencil,
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
} from "../../../lib/structural-calculations";
import { formatNumber, formatCurrency } from "../../../lib/utils";
import { BLOCK_TYPES, WALL_CATEGORIES, WASTE_PERCENTAGES } from "../../../constants/blocks";

interface BlocksSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		quantity: number;
		dimensions: Record<string, number>;
		totalCost: number;
	}>;
	onSave: () => void;
	onUpdate: () => void;
}

// أسعار البلوك والمواد
const BLOCK_PRICES: Record<number, number> = {
	10: 2.5,
	15: 3.0,
	20: 3.5,
	25: 4.0,
	30: 4.5,
};

const MORTAR_PRICE = 150; // ريال/م³
const LINTEL_CONCRETE_PRICE = 350; // ريال/م³
const LINTEL_REBAR_PRICE = 4; // ريال/كجم
const LABOR_PRICE_PER_SQM = 25; // ريال/م²

interface EnhancedBlockResult {
	grossArea: number;
	openingsArea: number;
	netArea: number;
	blocks: {
		count: number;
		wasteCount: number;
		totalCount: number;
		wastePercentage: number;
		pricePerBlock: number;
		totalCost: number;
	};
	mortar: {
		volume: number;
		cementBags: number;
		sandVolume: number;
		cost: number;
	};
	lintels: {
		count: number;
		totalLength: number;
		concreteVolume: number;
		rebarWeight: number;
		cost: number;
	} | null;
	costs: {
		blocks: number;
		mortar: number;
		lintels: number;
		labor: number;
		total: number;
	};
}

interface Opening {
	id: string;
	type: "door" | "window";
	width: number;
	height: number;
	quantity: number;
}

export function BlocksSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: BlocksSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		length: 0, // متر
		height: 0, // متر
		thickness: 20 as 10 | 15 | 20 | 25 | 30,
		blockType: "hollow" as keyof typeof BLOCK_TYPES,
		wallCategory: "internal" as keyof typeof WALL_CATEGORIES,
		hasLintel: true,
		// الفتحات
		openings: [] as Opening[],
	});

	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemCreated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onSave();
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
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemUpdateError"));
			},
		})
	);

	const deleteMutation = useMutation(
		orpc.pricing.studies.structuralItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemDeleted"));
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemDeleteError"));
			},
		})
	);

	const resetForm = () => {
		setFormData({
			name: "",
			length: 0,
			height: 0,
			thickness: 20,
			blockType: "hollow",
			wallCategory: "internal",
			hasLintel: true,
			openings: [],
		});
	};

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

		// حساب الأعتاب
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
		if (!formData.name || !calculations) return;

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
			},
			concreteVolume: calculations.lintels?.concreteVolume || 0,
			steelWeight: calculations.lintels?.rebarWeight || 0,
			materialCost: calculations.costs.blocks + calculations.costs.mortar + calculations.costs.lintels,
			laborCost: calculations.costs.labor,
			totalCost: calculations.costs.total,
		};

		if (editingItemId) {
			updateMutation.mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			createMutation.mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId, costStudyId: studyId });
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
		<div className="space-y-4">
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("pricing.studies.structural.itemName")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.area")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.thickness")}</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.quantity")}</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>
										{formatNumber(
											(item.dimensions?.length || 0) * (item.dimensions?.height || 0)
										)}{" "}
										{t("pricing.studies.units.m2")}
									</TableCell>
									<TableCell>
										{item.dimensions?.thickness || 0} {t("pricing.studies.units.cm")}
									</TableCell>
									<TableCell>
										{item.quantity} {t("pricing.studies.units.piece")}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingItemId(item.id);
													setIsAdding(true);
													setFormData({
														name: item.name,
														length: item.dimensions?.length || 0,
														height: item.dimensions?.height || 0,
														thickness: (item.dimensions?.thickness || 20) as 10 | 15 | 20 | 25 | 30,
														blockType: "hollow",
														wallCategory: "internal",
														hasLintel: true,
														openings: [],
													});
												}}
												title={t("common.edit")}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(item.id)}
												disabled={deleteMutation.isPending}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* البيانات الأساسية */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="col-span-2">
								<Label>{t("pricing.studies.structural.itemName")}</Label>
								<Input
									placeholder={t("pricing.studies.structural.itemNamePlaceholder")}
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								/>
							</div>

							<div>
								<Label>{t("pricing.studies.structural.thickness")} ({t("pricing.studies.units.cm")})</Label>
								<Select
									value={formData.thickness.toString()}
									onValueChange={(v) =>
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

						{/* أبعاد الجدار */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<Label>{t("pricing.studies.structural.length")} ({t("pricing.studies.units.m")})</Label>
								<Input
									type="number"
									step="0.1"
									min={0}
									value={formData.length || ""}
									onChange={(e) =>
										setFormData({ ...formData, length: +e.target.value })
									}
								/>
							</div>
							<div>
								<Label>{t("pricing.studies.structural.height")} ({t("pricing.studies.units.m")})</Label>
								<Input
									type="number"
									step="0.1"
									min={0}
									value={formData.height || ""}
									onChange={(e) =>
										setFormData({ ...formData, height: +e.target.value })
									}
								/>
							</div>
							<div>
								<Label>تصنيف الجدار</Label>
								<Select
									value={formData.wallCategory}
									onValueChange={(v: keyof typeof WALL_CATEGORIES) =>
										setFormData({ ...formData, wallCategory: v })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(WALL_CATEGORIES).map(([key, value]) => (
											<SelectItem key={key} value={key}>
												{value.nameAr}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
													onChange={(e) =>
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
													onChange={(e) =>
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
													onChange={(e) =>
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
											id="hasLintel"
											checked={formData.hasLintel}
											onChange={(e) =>
												setFormData({ ...formData, hasLintel: e.target.checked })
											}
											className="rounded"
										/>
										<Label htmlFor="hasLintel" className="text-sm">
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

								{/* تفاصيل إضافية */}
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

										{/* تفاصيل الأعتاب */}
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

										{/* ملخص الأسياخ المطلوبة */}
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

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								{t("pricing.studies.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !calculations}
							>
								<Save className="h-4 w-4 ml-2" />
								{editingItemId ? t("pricing.studies.structural.updateItem") : t("pricing.studies.structural.saveItem")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button
					variant="outline"
					className="w-full border-dashed"
					onClick={() => setIsAdding(true)}
				>
					<Plus className="h-4 w-4 ml-2" />
					{t("pricing.studies.structural.addItem")}
				</Button>
			)}

			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">{t("pricing.studies.summary.totalItems")}</h4>
					<div className="text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.structural.quantity")}:
							</span>
							<p className="font-bold">
								{items.reduce((sum, i) => sum + i.quantity, 0)} {t("pricing.studies.units.piece")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
