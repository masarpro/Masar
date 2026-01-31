"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
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
import { Plus, Save, Trash2, Calculator, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { calculateSlab } from "../../lib/calculations";
import {
	calculateSolidSlab,
	calculateFlatSlab,
	calculateRibbedSlab,
	calculateHollowCoreSlab,
	calculateBandedBeamSlab,
} from "../../lib/structural-calculations";
import { formatNumber, formatCurrency } from "../../lib/utils";
import { CONCRETE_TYPES, REBAR_DIAMETERS } from "../../constants/prices";
import { SLAB_TYPE_INFO } from "../../constants/slabs";

interface SlabsSectionProps {
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

export function SlabsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: SlabsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		slabType: "solid" as "solid" | "flat" | "ribbed" | "hollow_core" | "banded_beam",
		length: 0,
		width: 0,
		thickness: 15, // سم
		mainBarDiameter: 12,
		mainBarSpacing: 150,
		secondaryBarDiameter: 10,
		secondaryBarSpacing: 200,
		concreteType: "C30",
		// للهوردي
		ribWidth: 15,
		ribSpacing: 52,
		blockHeight: 20,
		toppingThickness: 5,
	});

	const createMutation = useMutation(
		orpc.quantities.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemCreated"));
				setIsAdding(false);
				onSave();
			},
			onError: () => {
				toast.error(t("quantities.messages.itemCreateError"));
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

	const calculations =
		formData.length > 0 && formData.width > 0 && formData.thickness > 0
			? calculateSlab({
					length: formData.length,
					width: formData.width,
					thickness: formData.thickness,
					slabType: formData.slabType,
					mainBarDiameter: formData.mainBarDiameter,
					mainBarSpacing: formData.mainBarSpacing,
					secondaryBarDiameter: formData.secondaryBarDiameter,
					secondaryBarSpacing: formData.secondaryBarSpacing,
					concreteType: formData.concreteType,
				})
			: null;

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		createMutation.mutate({
			costStudyId: studyId,
			organizationId,
			category: "slabs",
			subCategory: formData.slabType,
			name: formData.name,
			quantity: 1,
			unit: "m2",
			dimensions: {
				length: formData.length,
				width: formData.width,
				thickness: formData.thickness,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: formData.concreteType,
			steelWeight: calculations.rebarWeight,
			steelRatio: (calculations.rebarWeight / calculations.concreteVolume) || 0,
			materialCost:
				calculations.concreteCost +
				calculations.rebarCost +
				calculations.blocksCost,
			laborCost: calculations.laborCost,
			totalCost: calculations.totalCost,
		});
	};

	const handleDelete = (id: string) => {
		if (confirm(t("quantities.messages.confirmDelete"))) {
			deleteMutation.mutate({ id, organizationId });
		}
	};

	return (
		<div className="space-y-4">
			{items.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">{t("quantities.structural.itemName")}</TableHead>
								<TableHead className="text-right">{t("quantities.area")}</TableHead>
								<TableHead className="text-right">{t("quantities.structural.thickness")}</TableHead>
								<TableHead className="text-right">{t("quantities.structural.concreteVolume")}</TableHead>
								<TableHead className="text-right">{t("quantities.structural.steelWeight")}</TableHead>
								<TableHead className="text-right">{t("quantities.totalCost")}</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>
										{formatNumber(
											(item.dimensions?.length || 0) * (item.dimensions?.width || 0)
										)}{" "}
										{t("quantities.units.m2")}
									</TableCell>
									<TableCell>
										{item.dimensions?.thickness || 0} {t("quantities.units.cm")}
									</TableCell>
									<TableCell>
										{formatNumber(item.concreteVolume)} {t("quantities.units.m3")}
									</TableCell>
									<TableCell>
										{formatNumber(item.steelWeight)} {t("quantities.units.kg")}
									</TableCell>
									<TableCell className="font-medium">
										{formatCurrency(item.totalCost)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(item.id)}
											disabled={deleteMutation.isPending}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
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
							<h4 className="font-medium">{t("quantities.structural.addItem")}</h4>
							<Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="col-span-2">
								<Label>{t("quantities.structural.itemName")}</Label>
								<Input
									placeholder={t("quantities.structural.itemNamePlaceholder")}
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								/>
							</div>

							<div>
								<Label>{t("quantities.structural.slabType.label")}</Label>
								<Select
									value={formData.slabType}
									onValueChange={(v: "solid" | "flat" | "ribbed" | "hollow_core" | "banded_beam") =>
										setFormData({ ...formData, slabType: v })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="solid">
											{SLAB_TYPE_INFO.solid?.nameAr || t("quantities.structural.slabType.solid")}
										</SelectItem>
										<SelectItem value="flat">
											{SLAB_TYPE_INFO.flat?.nameAr || "فلات سلاب"}
										</SelectItem>
										<SelectItem value="ribbed">
											{SLAB_TYPE_INFO.ribbed?.nameAr || t("quantities.structural.slabType.ribbed")}
										</SelectItem>
										<SelectItem value="hollow_core">
											{SLAB_TYPE_INFO.hollow_core?.nameAr || "هولوكور / بانيل"}
										</SelectItem>
										<SelectItem value="banded_beam">
											{SLAB_TYPE_INFO.banded_beam?.nameAr || "كمرات عريضة"}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>{t("quantities.structural.concreteType")}</Label>
								<Select
									value={formData.concreteType}
									onValueChange={(v) => setFormData({ ...formData, concreteType: v })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CONCRETE_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>{t("quantities.structural.length")} ({t("quantities.units.m")})</Label>
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
								<Label>{t("quantities.structural.width")} ({t("quantities.units.m")})</Label>
								<Input
									type="number"
									step="0.1"
									min={0}
									value={formData.width || ""}
									onChange={(e) =>
										setFormData({ ...formData, width: +e.target.value })
									}
								/>
							</div>
							<div>
								<Label>{t("quantities.structural.thickness")} ({t("quantities.units.cm")})</Label>
								<Input
									type="number"
									min={0}
									value={formData.thickness}
									onChange={(e) =>
										setFormData({ ...formData, thickness: +e.target.value })
									}
								/>
							</div>
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-3">{t("quantities.structural.steelRatio")}</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<Label>Main {t("quantities.structural.diameter")}</Label>
									<Select
										value={formData.mainBarDiameter.toString()}
										onValueChange={(v) =>
											setFormData({ ...formData, mainBarDiameter: +v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{REBAR_DIAMETERS.filter((d) => d >= 10 && d <= 18).map(
												(d) => (
													<SelectItem key={d} value={d.toString()}>
														{d}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>{t("quantities.structural.spacing")} ({t("quantities.units.mm")})</Label>
									<Input
										type="number"
										value={formData.mainBarSpacing}
										onChange={(e) =>
											setFormData({ ...formData, mainBarSpacing: +e.target.value })
										}
									/>
								</div>
								<div>
									<Label>Secondary {t("quantities.structural.diameter")}</Label>
									<Select
										value={formData.secondaryBarDiameter.toString()}
										onValueChange={(v) =>
											setFormData({ ...formData, secondaryBarDiameter: +v })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{REBAR_DIAMETERS.filter((d) => d >= 8 && d <= 14).map(
												(d) => (
													<SelectItem key={d} value={d.toString()}>
														{d}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>{t("quantities.structural.spacing")} ({t("quantities.units.mm")})</Label>
									<Input
										type="number"
										value={formData.secondaryBarSpacing}
										onChange={(e) =>
											setFormData({
												...formData,
												secondaryBarSpacing: +e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>

						{calculations && (
							<div className="bg-muted/50 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-3">
									<Calculator className="h-5 w-5 text-primary" />
									<h4 className="font-medium">{t("quantities.calculations.results")}</h4>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">{t("quantities.area")}:</span>
										<p className="font-bold text-lg">
											{formatNumber(calculations.area)} {t("quantities.units.m2")}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("quantities.structural.concreteVolume")}:
										</span>
										<p className="font-bold text-lg">
											{formatNumber(calculations.concreteVolume)} {t("quantities.units.m3")}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("quantities.structural.steelWeight")}:
										</span>
										<p className="font-bold text-lg">
											{formatNumber(calculations.rebarWeight)} {t("quantities.units.kg")}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("quantities.totalCost")}:
										</span>
										<p className="font-bold text-lg text-primary">
											{formatCurrency(calculations.totalCost)}
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setIsAdding(false)}>
								{t("quantities.form.cancel")}
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || !formData.name || !calculations}
							>
								<Save className="h-4 w-4 ml-2" />
								{t("quantities.structural.saveItem")}
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
					{t("quantities.structural.addItem")}
				</Button>
			)}

			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">{t("quantities.summary.totalItems")}</h4>
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("quantities.summary.totalConcrete")}:
							</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.concreteVolume, 0))}{" "}
								{t("quantities.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("quantities.summary.totalRebar")}:
							</span>
							<p className="font-bold">
								{formatNumber(items.reduce((sum, i) => sum + i.steelWeight, 0))}{" "}
								{t("quantities.units.kg")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("quantities.summary.totalCost")}:
							</span>
							<p className="font-bold text-primary">
								{formatCurrency(items.reduce((sum, i) => sum + i.totalCost, 0))}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
