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
import { calculateFoundation } from "../../lib/calculations";
import {
	calculateIsolatedFoundation,
	calculateCombinedFoundation,
	calculateStripFoundation,
	calculateRaftFoundation,
} from "../../lib/structural-calculations";
import { formatNumber, formatCurrency } from "../../lib/utils";
import { CONCRETE_TYPES, REBAR_DIAMETERS } from "../../constants/prices";

interface FoundationsSectionProps {
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

export function FoundationsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: FoundationsSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		type: "isolated",
		quantity: 1,
		length: 0,
		width: 0,
		depth: 0,
		mainBarDiameter: 16,
		mainBarSpacing: 150,
		secondaryBarDiameter: 12,
		secondaryBarSpacing: 200,
		concreteType: "C30",
	});

	const createMutation = useMutation(
		orpc.quantities.structuralItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.messages.itemCreated"));
				setIsAdding(false);
				resetForm();
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

	const resetForm = () => {
		setFormData({
			name: "",
			type: "isolated",
			quantity: 1,
			length: 0,
			width: 0,
			depth: 0,
			mainBarDiameter: 16,
			mainBarSpacing: 150,
			secondaryBarDiameter: 12,
			secondaryBarSpacing: 200,
			concreteType: "C30",
		});
	};

	const calculations =
		formData.length > 0 && formData.width > 0 && formData.depth > 0
			? calculateFoundation({
					quantity: formData.quantity,
					length: formData.length,
					width: formData.width,
					depth: formData.depth,
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
			category: "foundations",
			subCategory: formData.type,
			name: formData.name,
			quantity: formData.quantity,
			unit: "m3",
			dimensions: {
				length: formData.length,
				width: formData.width,
				depth: formData.depth,
			},
			concreteVolume: calculations.concreteVolume,
			concreteType: formData.concreteType,
			steelWeight: calculations.rebarWeight,
			steelRatio: (calculations.rebarWeight / calculations.concreteVolume) || 0,
			materialCost: calculations.concreteCost + calculations.rebarCost,
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
								<TableHead className="text-right">{t("quantities.structural.quantity")}</TableHead>
								<TableHead className="text-right">{t("quantities.form.dimensions")}</TableHead>
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
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{item.dimensions?.length || 0}×{item.dimensions?.width || 0}×
										{item.dimensions?.depth || 0} {t("quantities.units.m")}
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
								<Label>{t("quantities.structural.foundationType.isolated")}</Label>
								<Select
									value={formData.type}
									onValueChange={(v) => setFormData({ ...formData, type: v })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="isolated">
											{t("quantities.structural.foundationType.isolated")}
										</SelectItem>
										<SelectItem value="combined">
											{t("quantities.structural.foundationType.combined")}
										</SelectItem>
										<SelectItem value="strip">
											{t("quantities.structural.foundationType.strip")}
										</SelectItem>
										<SelectItem value="raft">
											{t("quantities.structural.foundationType.raft")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>{t("quantities.structural.quantity")}</Label>
								<Input
									type="number"
									min={1}
									value={formData.quantity}
									onChange={(e) =>
										setFormData({ ...formData, quantity: +e.target.value })
									}
								/>
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
								<Label>{t("quantities.structural.depth")} ({t("quantities.units.m")})</Label>
								<Input
									type="number"
									step="0.1"
									min={0}
									value={formData.depth || ""}
									onChange={(e) =>
										setFormData({ ...formData, depth: +e.target.value })
									}
								/>
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
						</div>

						<div className="border-t pt-4">
							<h4 className="font-medium mb-3">{t("quantities.structural.steelRatio")}</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<Label>{t("quantities.structural.diameter")} ({t("quantities.units.mm")})</Label>
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
											{REBAR_DIAMETERS.map((d) => (
												<SelectItem key={d} value={d.toString()}>
													{d}
												</SelectItem>
											))}
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
									<Label>{t("quantities.structural.diameter")} ({t("quantities.units.mm")})</Label>
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
											{REBAR_DIAMETERS.filter((d) => d <= 16).map((d) => (
												<SelectItem key={d} value={d.toString()}>
													{d}
												</SelectItem>
											))}
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
											{t("quantities.structural.formworkArea")}:
										</span>
										<p className="font-bold text-lg">
											{formatNumber(calculations.formworkArea)} {t("quantities.units.m2")}
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
