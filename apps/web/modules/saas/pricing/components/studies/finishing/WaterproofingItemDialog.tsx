"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	WATERPROOFING_LOCATIONS,
	WATERPROOFING_MATERIALS,
	calculateWaterproofingQuantity,
	type WaterproofingMaterialKey,
} from "../../../lib/insulation-config";

interface WaterproofingItemData {
	id?: string;
	category: string;
	subCategory?: string;
	name: string;
	floorId?: string;
	floorName?: string;
	area?: number;
	length?: number;
	width?: number;
	quantity?: number;
	unit: string;
	calculationMethod?: string;
	calculationData?: Record<string, unknown>;
	wastagePercent: number;
	materialPrice: number;
	laborPrice: number;
	totalCost: number;
}

interface WaterproofingItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	editItem?: WaterproofingItemData;
}

export function WaterproofingItemDialog({
	open,
	onOpenChange,
	organizationId,
	studyId,
	editItem,
}: WaterproofingItemDialogProps) {
	const t = useTranslations("pricing.studies.finishing.waterproofing");
	const tFinishing = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const isEdit = !!editItem?.id;

	// Form state
	const [name, setName] = useState("العزل المائي");
	const [locations, setLocations] = useState<string[]>([]);
	const [materialKey, setMaterialKey] = useState<WaterproofingMaterialKey>("bitumen_rolls");
	const [customMaterialName, setCustomMaterialName] = useState("");
	const [thickness, setThickness] = useState(4);
	const [layers, setLayers] = useState(1);
	const [includesPrimer, setIncludesPrimer] = useState(false);
	const [areaInput, setAreaInput] = useState<number | "">("");
	const [lengthInput, setLengthInput] = useState<number | "">("");
	const [widthInput, setWidthInput] = useState<number | "">("");

	// Reset form when dialog opens
	useEffect(() => {
		if (!open) return;

		if (editItem) {
			const cd = editItem.calculationData as Record<string, unknown> | undefined;
			setName(editItem.name || "العزل المائي");
			setLocations((cd?.locations as string[]) ?? []);
			setMaterialKey((cd?.materialType as WaterproofingMaterialKey) ?? "bitumen_rolls");
			setCustomMaterialName((cd?.customMaterialName as string) ?? "");
			setThickness((cd?.thickness as number) ?? 4);
			setLayers((cd?.layers as number) ?? 1);
			setIncludesPrimer((cd?.includesPrimer as boolean) ?? false);
			setAreaInput(editItem.area || "");
			setLengthInput(editItem.length || "");
			setWidthInput(editItem.width || "");
		} else {
			setName("العزل المائي");
			setLocations([]);
			setMaterialKey("bitumen_rolls");
			setCustomMaterialName("");
			setThickness(4);
			setLayers(1);
			setIncludesPrimer(false);
			setAreaInput("");
			setLengthInput("");
			setWidthInput("");
		}
	}, [open, editItem]);

	// When material changes, update thickness and wastage defaults
	useEffect(() => {
		const mat = WATERPROOFING_MATERIALS[materialKey];
		if (mat) {
			setThickness(mat.defaultThickness);
		}
	}, [materialKey]);

	// Compute area from inputs
	const computedArea = useMemo(() => {
		if (typeof areaInput === "number" && areaInput > 0) return areaInput;
		if (typeof lengthInput === "number" && typeof widthInput === "number" && lengthInput > 0 && widthInput > 0) {
			return lengthInput * widthInput;
		}
		return 0;
	}, [areaInput, lengthInput, widthInput]);

	// Calculate quantities
	const calculation = useMemo(() => {
		if (computedArea <= 0) return null;
		return calculateWaterproofingQuantity({
			area: computedArea,
			materialKey,
			layers,
			includesPrimer,
		});
	}, [computedArea, materialKey, layers, includesPrimer]);

	const mat = WATERPROOFING_MATERIALS[materialKey];

	// Toggle location
	const toggleLocation = (locId: string) => {
		setLocations((prev) =>
			prev.includes(locId) ? prev.filter((l) => l !== locId) : [...prev, locId],
		);
	};

	// Mutations
	const createMutation = useMutation(
		orpc.pricing.studies.finishingItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(tFinishing("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(tFinishing("itemSaveError")),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(tFinishing("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(tFinishing("itemSaveError")),
		}),
	);

	const handleSave = () => {
		const finalQuantity = calculation?.finalQuantity ?? computedArea;

		const calculationData = {
			materialType: materialKey,
			customMaterialName: materialKey === "other" ? customMaterialName : "",
			locations,
			thickness,
			layers,
			includesPrimer,
			overlapPercent: mat?.overlapPercent ?? 0,
			primerArea: calculation?.primerArea ?? 0,
			breakdown: calculation
				? {
						netArea: calculation.netArea,
						overlapArea: calculation.overlapArea,
						effectiveArea: calculation.effectiveArea,
						wastageArea: calculation.wastageArea,
						finalQuantity: calculation.finalQuantity,
					}
				: null,
		};

		const itemData = {
			name,
			category: "FINISHING_WATERPROOFING",
			subCategory: "waterproofing",
			area: computedArea || undefined,
			length: typeof lengthInput === "number" && lengthInput > 0 ? lengthInput : undefined,
			width: typeof widthInput === "number" && widthInput > 0 ? widthInput : undefined,
			quantity: finalQuantity,
			unit: "m2",
			wastagePercent: mat?.wastagePercent ?? 10,
			calculationMethod: "waterproofing_professional",
			calculationData,
			materialPrice: 0,
			laborPrice: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
		};

		if (isEdit && editItem?.id) {
			updateMutation.mutate({
				organizationId,
				costStudyId: studyId,
				id: editItem.id,
				...itemData,
			});
		} else {
			createMutation.mutate({
				organizationId,
				costStudyId: studyId,
				...itemData,
			});
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? tFinishing("editItem") : t("title")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Name */}
					<div className="space-y-1">
						<Label className="text-sm">{t("name")}</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					{/* Location picker */}
					<div className="space-y-1">
						<Label className="text-sm">{t("location")}</Label>
						<div className="flex flex-wrap gap-2">
							{WATERPROOFING_LOCATIONS.map((loc) => (
								<Badge
									key={loc.id}
									variant={locations.includes(loc.id) ? "default" : "outline"}
									className="cursor-pointer select-none"
									onClick={() => toggleLocation(loc.id)}
								>
									{loc.ar}
								</Badge>
							))}
						</div>
					</div>

					{/* Material type */}
					<div className="space-y-1">
						<Label className="text-sm">{t("materialType")}</Label>
						<Select
							value={materialKey}
							onValueChange={(v) => setMaterialKey(v as WaterproofingMaterialKey)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(WATERPROOFING_MATERIALS).map(([key, val]) => (
									<SelectItem key={key} value={key}>
										{val.ar}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Custom material name */}
					{materialKey === "other" && (
						<div className="space-y-1">
							<Label className="text-sm">{t("otherMaterial")}</Label>
							<Input
								value={customMaterialName}
								onChange={(e) => setCustomMaterialName(e.target.value)}
							/>
						</div>
					)}

					{/* Thickness & Layers row */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("thickness")} (مم)</Label>
							<Input
								type="number"
								value={thickness || ""}
								onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("layers")}</Label>
							<Select
								value={String(layers)}
								onValueChange={(v) => setLayers(Number(v))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">{t("layer1")}</SelectItem>
									<SelectItem value="2">{t("layer2")}</SelectItem>
									<SelectItem value="3">{t("layer3")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Include primer */}
					<div className="flex items-center gap-2">
						<Checkbox
							id="includesPrimer"
							checked={includesPrimer}
							onCheckedChange={(v) => setIncludesPrimer(v === true)}
						/>
						<Label htmlFor="includesPrimer" className="text-sm cursor-pointer">
							{t("includePrimer")}
						</Label>
					</div>

					{/* Area calculation row */}
					<div className="space-y-1">
						<Label className="text-sm">{t("areaCalc")}</Label>
						<div className="grid grid-cols-3 gap-2">
							<div>
								<Label className="text-xs text-muted-foreground">{t("area")} (م²)</Label>
								<Input
									type="number"
									value={areaInput}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										setAreaInput(Number.isNaN(val) ? "" : val);
										if (!Number.isNaN(val) && val > 0) {
											setLengthInput("");
											setWidthInput("");
										}
									}}
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("length")} (م)</Label>
								<Input
									type="number"
									value={lengthInput}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										setLengthInput(Number.isNaN(val) ? "" : val);
										if (!Number.isNaN(val) && val > 0) setAreaInput("");
									}}
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("width")} (م)</Label>
								<Input
									type="number"
									value={widthInput}
									onChange={(e) => {
										const val = parseFloat(e.target.value);
										setWidthInput(Number.isNaN(val) ? "" : val);
										if (!Number.isNaN(val) && val > 0) setAreaInput("");
									}}
								/>
							</div>
						</div>
					</div>

					{/* Wastage (read-only) */}
					<div className="space-y-1">
						<Label className="text-sm">{t("wastage")}</Label>
						<Input
							type="text"
							value={`${mat?.wastagePercent ?? 10}%`}
							readOnly
							className="bg-muted"
						/>
						<p className="text-xs text-muted-foreground">{t("autoByMaterial")}</p>
					</div>

					{/* Quantity summary */}
					{calculation && computedArea > 0 && (
						<div className="rounded-lg bg-muted p-3 space-y-1.5">
							<p className="font-medium text-sm mb-2">{t("summary")}</p>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("netArea")}</span>
								<span>{calculation.netArea.toFixed(2)} م²</span>
							</div>

							{calculation.overlapArea > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{t("overlap")} ({calculation.overlapPercent}%)
									</span>
									<span>+{calculation.overlapArea.toFixed(2)} م²</span>
								</div>
							)}

							{layers > 1 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										× {layers} {t("layers")}
									</span>
									<span>{calculation.effectiveArea.toFixed(2)} م²</span>
								</div>
							)}

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{t("wastageAmount")} ({calculation.wastagePercent}%)
								</span>
								<span>+{calculation.wastageArea.toFixed(2)} م²</span>
							</div>

							{calculation.primerArea > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("primer")}</span>
									<span>{calculation.primerArea.toFixed(2)} م²</span>
								</div>
							)}

							<div className="flex justify-between font-medium text-sm border-t pt-1.5 mt-1.5">
								<span>{t("finalQuantity")}</span>
								<span>{calculation.finalQuantity.toFixed(2)} م²</span>
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						{t("cancel")}
					</Button>
					<Button onClick={handleSave} disabled={isPending || computedArea <= 0}>
						{isPending ? "جارٍ الحفظ..." : t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
