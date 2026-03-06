"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
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
	THERMAL_INSULATION_LOCATIONS,
	THERMAL_INSULATION_MATERIALS,
	calculateThermalQuantity,
	type ThermalMaterialKey,
} from "../../../lib/insulation-config";

interface ThermalItemData {
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

interface ThermalInsulationItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	editItem?: ThermalItemData;
}

export function ThermalInsulationItemDialog({
	open,
	onOpenChange,
	organizationId,
	studyId,
	editItem,
}: ThermalInsulationItemDialogProps) {
	const t = useTranslations("pricing.studies.finishing.thermal");
	const tFinishing = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const isEdit = !!editItem?.id;

	// Form state
	const [name, setName] = useState("العزل الحراري");
	const [locations, setLocations] = useState<string[]>([]);
	const [materialKey, setMaterialKey] = useState<ThermalMaterialKey>("xps");
	const [customMaterialName, setCustomMaterialName] = useState("");
	const [thickness, setThickness] = useState(50);
	const [areaInput, setAreaInput] = useState<number | "">("");
	const [lengthInput, setLengthInput] = useState<number | "">("");
	const [widthInput, setWidthInput] = useState<number | "">("");
	const [deductions, setDeductions] = useState<number | "">(0);

	// Reset form when dialog opens
	useEffect(() => {
		if (!open) return;

		if (editItem) {
			const cd = editItem.calculationData as Record<string, unknown> | undefined;
			setName(editItem.name || "العزل الحراري");
			setLocations((cd?.locations as string[]) ?? []);
			setMaterialKey((cd?.materialType as ThermalMaterialKey) ?? "xps");
			setCustomMaterialName((cd?.customMaterialName as string) ?? "");
			setThickness((cd?.thickness as number) ?? 50);
			setDeductions((cd?.deductions as number) ?? 0);

			// Restore area/length/width from breakdown or item
			const breakdown = cd?.breakdown as Record<string, number> | undefined;
			const grossArea = breakdown?.grossArea ?? 0;
			if (grossArea > 0) {
				setAreaInput(grossArea);
				setLengthInput("");
				setWidthInput("");
			} else {
				setAreaInput("");
				setLengthInput(editItem.length || "");
				setWidthInput(editItem.width || "");
			}
		} else {
			setName("العزل الحراري");
			setLocations([]);
			setMaterialKey("xps");
			setCustomMaterialName("");
			setThickness(50);
			setAreaInput("");
			setLengthInput("");
			setWidthInput("");
			setDeductions(0);
		}
	}, [open, editItem]);

	// When material changes, update thickness default
	useEffect(() => {
		const mat = THERMAL_INSULATION_MATERIALS[materialKey];
		if (mat) {
			setThickness(mat.defaultThickness);
		}
	}, [materialKey]);

	// Compute gross area from inputs
	const grossArea = useMemo(() => {
		if (typeof areaInput === "number" && areaInput > 0) return areaInput;
		if (typeof lengthInput === "number" && typeof widthInput === "number" && lengthInput > 0 && widthInput > 0) {
			return lengthInput * widthInput;
		}
		return 0;
	}, [areaInput, lengthInput, widthInput]);

	const deductionVal = typeof deductions === "number" ? deductions : 0;

	// Calculate quantities
	const calculation = useMemo(() => {
		if (grossArea <= 0) return null;
		return calculateThermalQuantity({
			grossArea,
			deductions: deductionVal,
			materialKey,
			thickness,
		});
	}, [grossArea, deductionVal, materialKey, thickness]);

	const mat = THERMAL_INSULATION_MATERIALS[materialKey];

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
		const finalQuantity = calculation?.finalQuantity ?? 0;
		const netArea = calculation?.netArea ?? 0;

		const calculationData = {
			materialType: materialKey,
			customMaterialName: materialKey === "other" ? customMaterialName : "",
			locations,
			thickness,
			deductions: deductionVal,
			lambda: calculation?.lambda ?? 0,
			rValue: calculation?.rValue ?? 0,
			sbcCompliant: (calculation?.rValue ?? 0) > 0,
			breakdown: calculation
				? {
						grossArea: calculation.grossArea,
						deductions: calculation.deductions,
						netArea: calculation.netArea,
						wastageArea: calculation.wastageArea,
						finalQuantity: calculation.finalQuantity,
						volumeM3: calculation.volumeM3,
					}
				: null,
		};

		const itemData = {
			name,
			category: "FINISHING_THERMAL_INSULATION",
			subCategory: "thermal",
			area: netArea || undefined,
			length: typeof lengthInput === "number" && lengthInput > 0 ? lengthInput : undefined,
			width: typeof widthInput === "number" && widthInput > 0 ? widthInput : undefined,
			quantity: finalQuantity,
			unit: "m2",
			wastagePercent: mat?.wastagePercent ?? 10,
			calculationMethod: "thermal_insulation_professional",
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
	const hasNetArea = (calculation?.netArea ?? 0) > 0;

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
							{THERMAL_INSULATION_LOCATIONS.map((loc) => (
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
							onValueChange={(v) => setMaterialKey(v as ThermalMaterialKey)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(THERMAL_INSULATION_MATERIALS).map(([key, val]) => (
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

					{/* Thickness */}
					<div className="space-y-1">
						<Label className="text-sm">{t("thickness")} (مم)</Label>
						<Input
							type="number"
							value={thickness || ""}
							onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
						/>
						<p className="text-xs text-muted-foreground">{t("thicknessHint")}</p>
					</div>

					{/* Thermal info (read-only) */}
					{materialKey !== "other" && mat.lambda > 0 && (
						<div className="rounded-lg border p-3 space-y-1.5">
							<div className="flex items-center justify-between mb-1">
								<Label className="text-sm font-medium">{t("thermalInfo")}</Label>
								<Badge variant="secondary" className="text-xs">
									SBC 602
								</Badge>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("lambda")}</span>
								<span dir="ltr">{mat.lambda} W/m·K</span>
							</div>
							{thickness > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("rValue")}</span>
									<span dir="ltr">
										{((thickness / 1000) / mat.lambda).toFixed(2)} m²·K/W
									</span>
								</div>
							)}
						</div>
					)}

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

					{/* Deductions */}
					<div className="space-y-1">
						<Label className="text-sm">{t("deductions")} (م²)</Label>
						<Input
							type="number"
							value={deductions}
							onChange={(e) => {
								const val = parseFloat(e.target.value);
								setDeductions(Number.isNaN(val) ? "" : val);
							}}
						/>
						<p className="text-xs text-muted-foreground">{t("deductionsHint")}</p>
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
					{calculation && hasNetArea && (
						<div className="rounded-lg bg-muted p-3 space-y-1.5">
							<p className="font-medium text-sm mb-2">{t("summary")}</p>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("grossArea")}</span>
								<span>{calculation.grossArea.toFixed(2)} م²</span>
							</div>

							{calculation.deductions > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("deductions")}</span>
									<span>-{calculation.deductions.toFixed(2)} م²</span>
								</div>
							)}

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("netArea")}</span>
								<span>{calculation.netArea.toFixed(2)} م²</span>
							</div>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{t("wastageAmount")} ({calculation.wastagePercent}%)
								</span>
								<span>+{calculation.wastageArea.toFixed(2)} م²</span>
							</div>

							{calculation.volumeM3 > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("volume")}</span>
									<span>{calculation.volumeM3.toFixed(3)} م³</span>
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
					<Button onClick={handleSave} disabled={isPending || !hasNetArea}>
						{isPending ? "جارٍ الحفظ..." : t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
