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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { formatNumber, ELEMENT_PREFIXES } from "../../../lib/utils";
import { ElementHeaderRow } from "../shared";
import type { StructuralItemCreateInput, StructuralItemUpdateInput, StructuralItemDeleteInput } from "../../../types/structural-mutation";

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
	specs?: { concreteType: string; steelGrade: string };
}

type PlainConcreteType = "blinding" | "leveling" | "fill";

interface FormData {
	name: string;
	type: PlainConcreteType;
	quantity: number;
	length: number;
	width: number;
	area: number;
	thickness: number;
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
	specs,
}: PlainConcreteSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		type: "blinding",
		quantity: 1,
		length: 0,
		width: 0,
		area: 0,
		thickness: 0.10,
	});

	// عند تغيير الطول أو العرض، تُحسب المساحة تلقائياً
	const handleLengthChange = (length: number) => {
		const newArea = length * formData.width;
		setFormData({ ...formData, length, area: newArea > 0 ? newArea : formData.area });
	};

	const handleWidthChange = (width: number) => {
		const newArea = formData.length * width;
		setFormData({ ...formData, width, area: newArea > 0 ? newArea : formData.area });
	};

	// عند إدخال المساحة مباشرة، تُفرّغ الطول والعرض
	const handleAreaChange = (area: number) => {
		setFormData({ ...formData, area, length: 0, width: 0 });
	};

	// حساب النتائج
	const calculations = useMemo(() => {
		if (formData.area <= 0 || formData.thickness <= 0) return null;

		const volumePerUnit = formData.area * formData.thickness;
		const totalVolume = volumePerUnit * formData.quantity;

		return {
			area: formData.area,
			volumePerUnit,
			totalVolume,
		};
	}, [formData]);

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
			type: "blinding",
			quantity: 1,
			length: 0,
			width: 0,
			area: 0,
			thickness: 0.10,
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

		const itemData = {
			costStudyId: studyId,
			organizationId,
			category: "plainConcrete",
			subCategory: formData.type,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				length: formData.length,
				width: formData.width,
				area: formData.area,
				thickness: formData.thickness,
			},
			concreteVolume: calculations.totalVolume,
			concreteType: specs?.concreteType || "C15",
			steelWeight: 0,
			steelRatio: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
		};

		if (editingItemId) {
			(updateMutation.mutate as (data: StructuralItemUpdateInput) => void)({ ...itemData, id: editingItemId, costStudyId: studyId });
		} else {
			(createMutation.mutate as (data: StructuralItemCreateInput) => void)(itemData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation.mutate as (data: StructuralItemDeleteInput) => void)({ id, organizationId, costStudyId: studyId });
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
								<TableHead className="text-right">{t("pricing.studies.structural.itemName")}</TableHead>
								<TableHead className="text-right">النوع</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.quantity")}</TableHead>
								<TableHead className="text-right">الطول</TableHead>
								<TableHead className="text-right">العرض</TableHead>
								<TableHead className="text-right">المساحة</TableHead>
								<TableHead className="text-right">السماكة</TableHead>
								<TableHead className="text-right">{t("pricing.studies.structural.concreteVolume")}</TableHead>
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
											{item.dimensions?.length ? `${formatNumber(item.dimensions.length)} م` : "-"}
										</TableCell>
										<TableCell>
											{item.dimensions?.width ? `${formatNumber(item.dimensions.width)} م` : "-"}
										</TableCell>
										<TableCell>
											{formatNumber(area)} {t("pricing.studies.units.m2")}
										</TableCell>
										<TableCell>
											{((item.dimensions?.thickness || 0) * 100).toFixed(0)} {t("pricing.studies.units.cm")}
										</TableCell>
										<TableCell>
											{formatNumber(item.concreteVolume)} {t("pricing.studies.units.m3")}
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
															type: (item.subCategory as PlainConcreteType) || "blinding",
															quantity: item.quantity,
															length: item.dimensions?.length || 0,
															width: item.dimensions?.width || 0,
															area: item.dimensions?.area ||
																((item.dimensions?.length || 0) * (item.dimensions?.width || 0)),
															thickness: item.dimensions?.thickness || 0.10,
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
								{editingItemId ? t("pricing.studies.structural.editItem") : t("pricing.studies.structural.addItem")}
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
							showQuantity={true}
							showConcreteType={false}
							showSubType={true}
						/>

						{/* السطر الثاني: جميع حقول الأبعاد معاً */}
						<div className="border rounded-lg p-4 space-y-4">
							<div className="flex items-center gap-4">
								<Ruler className="h-5 w-5 text-primary" />
								<h5 className="font-medium">الأبعاد</h5>
								<span className="text-xs text-muted-foreground">
									أدخل الطول والعرض لحساب المساحة تلقائياً، أو أدخل المساحة مباشرة
								</span>
							</div>

							{/* جميع الحقول في سطر واحد */}
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
								{/* الطول */}
								<div className="space-y-1.5">
									<Label className="text-sm text-muted-foreground">الطول (م)</Label>
									<Input
										type="number"
										min={0}
										step={0.1}
										value={formData.length || ""}
										onChange={(e: any) => handleLengthChange(parseFloat(e.target.value) || 0)}
										className="text-center"
										placeholder="0.0"
									/>
								</div>

								{/* العرض */}
								<div className="space-y-1.5">
									<Label className="text-sm text-muted-foreground">العرض (م)</Label>
									<Input
										type="number"
										min={0}
										step={0.1}
										value={formData.width || ""}
										onChange={(e: any) => handleWidthChange(parseFloat(e.target.value) || 0)}
										className="text-center"
										placeholder="0.0"
									/>
								</div>

								{/* المساحة */}
								<div className="space-y-1.5">
									<Label className="text-sm text-muted-foreground">المساحة (م²)</Label>
									<Input
										type="number"
										min={0}
										step={0.1}
										value={formData.area || ""}
										onChange={(e: any) => handleAreaChange(parseFloat(e.target.value) || 0)}
										className={`text-center ${formData.length > 0 && formData.width > 0 ? "bg-muted/50 font-semibold text-primary" : ""}`}
										placeholder="0.0"
									/>
								</div>

								{/* السماكة */}
								<div className="space-y-1.5">
									<Label className="text-sm text-muted-foreground">السماكة (سم)</Label>
									<Input
										type="number"
										min={1}
										step={1}
										value={(formData.thickness * 100) || ""}
										onChange={(e: any) => setFormData({ ...formData, thickness: (parseFloat(e.target.value) || 0) / 100 })}
										className="text-center"
										placeholder="10"
									/>
								</div>

								{/* عرض الحجم المحسوب */}
								{calculations ? (
									<div className="bg-primary/10 rounded-lg p-3 flex flex-col justify-center items-center border border-primary/20">
										<span className="text-xs text-muted-foreground">الحجم</span>
										<span className="font-bold text-lg text-primary">
											{formatNumber(calculations.totalVolume)} م³
										</span>
									</div>
								) : (
									<div className="bg-muted/30 rounded-lg p-3 flex flex-col justify-center items-center border border-dashed">
										<span className="text-xs text-muted-foreground">الحجم</span>
										<span className="text-sm text-muted-foreground">—</span>
									</div>
								)}
							</div>
						</div>

						{/* نتائج الحساب */}
						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("pricing.studies.calculations.results")}</h4>
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
					className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
					variant="outline"
					onClick={handleStartAdding}
				>
					<Plus className="h-5 w-5 ml-2" />
					<span className="font-semibold">{t("pricing.studies.structural.addItem")}</span>
				</Button>
			)}

			{/* ملخص العناصر */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">{t("pricing.studies.summary.totalItems")}</h4>
					<div className="text-sm">
						<span className="text-muted-foreground">
							{t("pricing.studies.summary.totalConcrete")}:
						</span>
						<p className="font-bold text-lg">
							{formatNumber(items.reduce((sum, i) => sum + i.concreteVolume, 0))}{" "}
							{t("pricing.studies.units.m3")}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
