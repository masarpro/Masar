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
	Plus,
	Save,
	Trash2,
	Pencil,
	Calculator,
	X,
	Ruler,
	Square,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { formatNumber, ELEMENT_PREFIXES } from "../../lib/utils";
import { ElementHeaderRow } from "../shared";

interface PlainConcreteSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		subCategory?: string | null;
		quantity: number;
		dimensions: Record<string, number>;
		concreteVolume: number;
		steelWeight: number;
		totalCost: number;
	}>;
	onSave: () => void;
	onUpdate: () => void;
}

type PlainConcreteType = "blinding" | "leveling" | "fill";
type InputMode = "dimensions" | "area";

interface FormData {
	name: string;
	type: PlainConcreteType;
	quantity: number;
	inputMode: InputMode;
	length: number;
	width: number;
	directArea: number;
	thickness: number;
	concreteType: string;
}

const PLAIN_CONCRETE_TYPE_INFO: Record<PlainConcreteType, { nameAr: string; description: string; defaultThickness: number }> = {
	blinding: { nameAr: "صبة نظافة", description: "طبقة خرسانة عادية تحت القواعد", defaultThickness: 0.10 },
	leveling: { nameAr: "صبة تسوية", description: "طبقة تسوية للأرضيات", defaultThickness: 0.05 },
	fill: { nameAr: "خرسانة ردم", description: "خرسانة عادية للردم والتعبئة", defaultThickness: 0.15 },
};

// تحويل لصيغة مناسبة لـ ElementHeaderRow
const PLAIN_CONCRETE_SUBTYPES = Object.entries(PLAIN_CONCRETE_TYPE_INFO).map(([key, info]) => ({
	value: key,
	label: info.nameAr,
}));

export function PlainConcreteSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: PlainConcreteSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		type: "blinding",
		quantity: 1,
		inputMode: "dimensions",
		length: 0,
		width: 0,
		directArea: 0,
		thickness: 0.10,
		concreteType: "C15",
	});

	// حساب النتائج
	const calculations = useMemo(() => {
		let area: number;

		if (formData.inputMode === "area") {
			// وضع المساحة المباشرة
			if (formData.directArea <= 0 || formData.thickness <= 0) return null;
			area = formData.directArea;
		} else {
			// وضع الأبعاد
			if (formData.length <= 0 || formData.width <= 0 || formData.thickness <= 0) return null;
			area = formData.length * formData.width;
		}

		const volumePerUnit = area * formData.thickness;
		const totalVolume = volumePerUnit * formData.quantity;

		return {
			area,
			volumePerUnit,
			totalVolume,
		};
	}, [formData]);

	const createMutation = useMutation(
		orpc.quantities.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemCreated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onSave();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemCreateError"));
			},
		})
	);

	const updateMutation = useMutation(
		orpc.quantities.structuralItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemUpdated"));
				setIsAdding(false);
				setEditingItemId(null);
				resetForm();
				onUpdate();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemUpdateError"));
			},
		})
	);

	const deleteMutation = useMutation(
		orpc.quantities.structuralItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemDeleted"));
				onUpdate();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemDeleteError"));
			},
		})
	);

	const resetForm = () => {
		setFormData({
			name: "",
			type: "blinding",
			quantity: 1,
			inputMode: "dimensions",
			length: 0,
			width: 0,
			directArea: 0,
			thickness: 0.10,
			concreteType: "C15",
		});
	};

	const handleTypeChange = (type: string) => {
		const plainType = type as PlainConcreteType;
		setFormData({
			...formData,
			type: plainType,
			thickness: PLAIN_CONCRETE_TYPE_INFO[plainType].defaultThickness,
		});
	};

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		const area = formData.inputMode === "area"
			? formData.directArea
			: formData.length * formData.width;

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "plainConcrete",
			subCategory: formData.type,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				length: formData.inputMode === "dimensions" ? formData.length : 0,
				width: formData.inputMode === "dimensions" ? formData.width : 0,
				area: area,
				thickness: formData.thickness,
			},
			concreteVolume: calculations.totalVolume,
			concreteType: formData.concreteType,
			steelWeight: 0,
			steelRatio: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
		};

		if (editingItemId) {
			updateMutation.mutate({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			createMutation.mutate(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("quantities.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId, costStudyId: studyId });
		}
	};

	const handleStartAdding = () => {
		resetForm();
		setIsAdding(true);
	};

	return (
		<div className="space-y-4">
			{/* جدول العناصر الموجودة */}
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("quantities.structural.itemName")}</TableHead>
								<TableHead className="text-right">النوع</TableHead>
								<TableHead className="text-right">{t("quantities.structural.quantity")}</TableHead>
								<TableHead className="text-right">المساحة</TableHead>
								<TableHead className="text-right">السماكة</TableHead>
								<TableHead className="text-right">{t("quantities.structural.concreteVolume")}</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => {
								const area = item.dimensions?.area ||
									((item.dimensions?.length || 0) * (item.dimensions?.width || 0));
								return (
									<TableRow key={item.id}>
										<TableCell className="font-medium">{item.name}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{PLAIN_CONCRETE_TYPE_INFO[item.subCategory as PlainConcreteType]?.nameAr || item.subCategory}
											</Badge>
										</TableCell>
										<TableCell>{item.quantity}</TableCell>
										<TableCell>
											{formatNumber(area)} {t("quantities.units.m2")}
										</TableCell>
										<TableCell>
											{((item.dimensions?.thickness || 0) * 100).toFixed(0)} {t("quantities.units.cm")}
										</TableCell>
										<TableCell>
											{formatNumber(item.concreteVolume)} {t("quantities.units.m3")}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setEditingItemId(item.id);
														setIsAdding(true);
														const hasDirectArea = item.dimensions?.area &&
															(!item.dimensions?.length || !item.dimensions?.width);
														setFormData({
															name: item.name,
															type: (item.subCategory as PlainConcreteType) || "blinding",
															quantity: item.quantity,
															inputMode: hasDirectArea ? "area" : "dimensions",
															length: item.dimensions?.length || 0,
															width: item.dimensions?.width || 0,
															directArea: item.dimensions?.area ||
																((item.dimensions?.length || 0) * (item.dimensions?.width || 0)),
															thickness: item.dimensions?.thickness || 0.10,
															concreteType: "C15",
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
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* نموذج الإضافة */}
			{isAdding ? (
				<Card className="border-dashed border-2 border-primary/50">
					<CardContent className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">
								{editingItemId ? t("quantities.structural.editItem") : t("quantities.structural.addItem")}
							</h4>
							<Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* السطر الأول: البيانات الأساسية - باستخدام ElementHeaderRow */}
						<ElementHeaderRow
							autoNamePrefix={ELEMENT_PREFIXES.plainConcrete}
							existingCount={items.length}
							name={formData.name}
							onNameChange={(name) => setFormData({ ...formData, name })}
							subTypes={PLAIN_CONCRETE_SUBTYPES}
							selectedSubType={formData.type}
							onSubTypeChange={handleTypeChange}
							quantity={formData.quantity}
							onQuantityChange={(quantity) => setFormData({ ...formData, quantity })}
							concreteType={formData.concreteType}
							onConcreteTypeChange={(concreteType) => setFormData({ ...formData, concreteType })}
							showQuantity={true}
							showConcreteType={true}
							showSubType={true}
						/>

						{/* السطر الثاني: الأبعاد مع خيار المساحة المباشرة */}
						<div className="border rounded-lg p-4 space-y-4">
							{/* أزرار التبديل بين الوضعين */}
							<div className="flex items-center gap-4">
								<Ruler className="h-5 w-5 text-primary" />
								<h5 className="font-medium">الأبعاد</h5>
								<div className="flex-1" />
								<div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
									<button
										type="button"
										onClick={() => setFormData({ ...formData, inputMode: "dimensions" })}
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
											formData.inputMode === "dimensions"
												? "bg-primary text-primary-foreground"
												: "hover:bg-muted"
										}`}
									>
										<Ruler className="h-4 w-4" />
										طول × عرض
									</button>
									<button
										type="button"
										onClick={() => setFormData({ ...formData, inputMode: "area" })}
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
											formData.inputMode === "area"
												? "bg-primary text-primary-foreground"
												: "hover:bg-muted"
										}`}
									>
										<Square className="h-4 w-4" />
										مساحة جاهزة
									</button>
								</div>
							</div>

							{/* حقول الإدخال حسب الوضع */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
								{formData.inputMode === "dimensions" ? (
									<>
										{/* وضع الأبعاد: طول × عرض */}
										<div className="space-y-1.5">
											<Label className="text-sm text-muted-foreground">الطول (م)</Label>
											<Input
												type="number"
												min={0}
												step={0.1}
												value={formData.length || ""}
												onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
												className="text-center"
												placeholder="0.0"
											/>
										</div>
										<div className="space-y-1.5">
											<Label className="text-sm text-muted-foreground">العرض (م)</Label>
											<Input
												type="number"
												min={0}
												step={0.1}
												value={formData.width || ""}
												onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
												className="text-center"
												placeholder="0.0"
											/>
										</div>
									</>
								) : (
									<>
										{/* وضع المساحة المباشرة */}
										<div className="space-y-1.5 md:col-span-2">
											<Label className="text-sm text-muted-foreground">المساحة (م²)</Label>
											<Input
												type="number"
												min={0}
												step={1}
												value={formData.directArea || ""}
												onChange={(e) => setFormData({ ...formData, directArea: parseFloat(e.target.value) || 0 })}
												className="text-center text-lg"
												placeholder="أدخل المساحة بالمتر المربع"
											/>
										</div>
									</>
								)}

								{/* السماكة - مشترك في كلا الوضعين */}
								<div className="space-y-1.5">
									<Label className="text-sm text-muted-foreground">السماكة (سم)</Label>
									<Input
										type="number"
										min={1}
										step={1}
										value={(formData.thickness * 100) || ""}
										onChange={(e) => setFormData({ ...formData, thickness: (parseFloat(e.target.value) || 0) / 100 })}
										className="text-center"
										placeholder="10"
									/>
								</div>

								{/* عرض الحجم المحسوب */}
								{calculations && (
									<div className="bg-primary/10 rounded-lg p-3 flex flex-col justify-center items-center border border-primary/20">
										<span className="text-xs text-muted-foreground">الحجم</span>
										<span className="font-bold text-lg text-primary">
											{formatNumber(calculations.totalVolume)} م³
										</span>
									</div>
								)}
							</div>
						</div>

						{/* نتائج الحساب */}
						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("quantities.calculations.results")}</h4>
								</div>

								<div className="grid grid-cols-3 gap-4">
									<div className="bg-background rounded-lg p-3 text-center">
										<p className="text-xs text-muted-foreground">المساحة</p>
										<p className="text-lg font-bold text-blue-600">
											{formatNumber(calculations.area)} م²
										</p>
									</div>
									<div className="bg-background rounded-lg p-3 text-center">
										<p className="text-xs text-muted-foreground">الحجم للوحدة</p>
										<p className="text-lg font-bold text-green-600">
											{formatNumber(calculations.volumePerUnit)} م³
										</p>
									</div>
									<div className="bg-background rounded-lg p-3 text-center">
										<p className="text-xs text-muted-foreground">الحجم الإجمالي</p>
										<p className="text-lg font-bold text-primary">
											{formatNumber(calculations.totalVolume)} م³
										</p>
									</div>
								</div>
							</div>
						)}

						{/* أزرار الحفظ والإلغاء */}
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}>
								{t("quantities.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !calculations}
							>
								<Save className="h-4 w-4 ml-2" />
								{editingItemId ? t("quantities.structural.updateItem") : t("quantities.structural.saveItem")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button
					variant="outline"
					className="w-full border-dashed"
					onClick={handleStartAdding}
				>
					<Plus className="h-4 w-4 ml-2" />
					{t("quantities.structural.addItem")}
				</Button>
			)}

			{/* ملخص العناصر */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">{t("quantities.summary.totalItems")}</h4>
					<div className="text-sm">
						<span className="text-muted-foreground">
							{t("quantities.summary.totalConcrete")}:
						</span>
						<p className="font-bold text-lg">
							{formatNumber(items.reduce((sum, i) => sum + i.concreteVolume, 0))}{" "}
							{t("quantities.units.m3")}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
