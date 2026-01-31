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
import { calculateBlocks } from "../../lib/calculations";
import {
	calculateWall,
	calculateBlocksSummary,
	calculateMortar,
	calculateLintels,
} from "../../lib/structural-calculations";
import { formatNumber, formatCurrency } from "../../lib/utils";
import { BLOCK_TYPES, WALL_CATEGORIES } from "../../constants/blocks";

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

export function BlocksSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
}: BlocksSectionProps) {
	const t = useTranslations();
	const [isAdding, setIsAdding] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		length: 0, // متر
		height: 0, // متر
		thickness: 20 as 10 | 15 | 20 | 25 | 30,
		blockType: "hollow" as keyof typeof BLOCK_TYPES,
		wallCategory: "internal" as keyof typeof WALL_CATEGORIES,
		hasLintel: false,
		// الفتحات (للإصدارات القادمة)
		openingsCount: 0,
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
		formData.length > 0 && formData.height > 0
			? calculateBlocks({
					length: formData.length,
					height: formData.height,
					thickness: formData.thickness,
				})
			: null;

	const handleSubmit = async () => {
		if (!formData.name || !calculations) return;

		createMutation.mutate({
			costStudyId: studyId,
			organizationId,
			category: "blocks",
			name: formData.name,
			quantity: calculations.blocksCount,
			unit: "piece",
			dimensions: {
				length: formData.length,
				height: formData.height,
				thickness: formData.thickness,
			},
			concreteVolume: 0,
			steelWeight: 0,
			materialCost: calculations.materialCost,
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
								<TableHead className="text-right">{t("quantities.structural.quantity")}</TableHead>
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
											(item.dimensions?.length || 0) * (item.dimensions?.height || 0)
										)}{" "}
										{t("quantities.units.m2")}
									</TableCell>
									<TableCell>
										{item.dimensions?.thickness || 0} {t("quantities.units.cm")}
									</TableCell>
									<TableCell>
										{item.quantity} {t("quantities.units.piece")}
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
								<Label>{t("quantities.structural.thickness")} ({t("quantities.units.cm")})</Label>
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
										<SelectItem value="10">10</SelectItem>
										<SelectItem value="15">15</SelectItem>
										<SelectItem value="20">20</SelectItem>
										<SelectItem value="25">25</SelectItem>
										<SelectItem value="30">30</SelectItem>
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
								<Label>{t("quantities.structural.height")} ({t("quantities.units.m")})</Label>
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
											{formatNumber(calculations.netArea)} {t("quantities.units.m2")}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("quantities.structural.quantity")}:
										</span>
										<p className="font-bold text-lg">
											{calculations.blocksCount} {t("quantities.units.piece")}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("quantities.structural.materialCost")}:
										</span>
										<p className="font-bold text-lg">
											{formatCurrency(calculations.materialCost)}
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
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("quantities.structural.quantity")}:
							</span>
							<p className="font-bold">
								{items.reduce((sum, i) => sum + i.quantity, 0)} {t("quantities.units.piece")}
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
