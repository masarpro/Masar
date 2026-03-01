"use client";

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
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CalculatorResult } from "../../../../lib/finishing-types";

interface Opening {
	id: string;
	type: string;
	width: number;
	height: number;
	count: number;
}

const PRESET_OPENINGS = [
	{ type: "standardDoor", width: 0.9, height: 2.1 },
	{ type: "bathroomDoor", width: 0.7, height: 2.1 },
	{ type: "mainDoor", width: 1.2, height: 2.4 },
	{ type: "largeWindow", width: 1.5, height: 1.5 },
	{ type: "mediumWindow", width: 1.2, height: 1.2 },
	{ type: "smallWindow", width: 0.6, height: 0.6 },
];

let openingCounter = 0;

interface WallDeductionCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
	floorHeight?: number;
	floorArea?: number;
	wastagePercent?: number;
}

export function WallDeductionCalculator({
	open,
	onOpenChange,
	onApply,
	floorHeight = 3.2,
	floorArea = 0,
	wastagePercent = 0,
}: WallDeductionCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [wallPerimeter, setWallPerimeter] = useState(0);
	const [wallHeight, setWallHeight] = useState(floorHeight);
	const [includeCeiling, setIncludeCeiling] = useState(false);
	const [ceilingArea, setCeilingArea] = useState(floorArea);
	const [openings, setOpenings] = useState<Opening[]>(
		PRESET_OPENINGS.map((p) => ({
			id: `opening-${++openingCounter}`,
			type: p.type,
			width: p.width,
			height: p.height,
			count: 0,
		})),
	);

	const wallArea = wallPerimeter * wallHeight;
	const totalDeductions = openings.reduce(
		(sum, o) => sum + o.width * o.height * o.count,
		0,
	);
	const netWallArea = Math.max(0, wallArea - totalDeductions);
	const totalWithCeiling = netWallArea + (includeCeiling ? ceilingArea : 0);
	const wastageAmount = totalWithCeiling * (wastagePercent / 100);
	const finalArea = totalWithCeiling + wastageAmount;

	const addCustomOpening = () => {
		setOpenings((prev) => [
			...prev,
			{
				id: `opening-${++openingCounter}`,
				type: "custom",
				width: 1,
				height: 1,
				count: 0,
			},
		]);
	};

	const updateOpening = (id: string, field: keyof Opening, value: number | string) => {
		setOpenings((prev) =>
			prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
		);
	};

	const removeOpening = (id: string) => {
		setOpenings((prev) => prev.filter((o) => o.id !== id));
	};

	const handleApply = () => {
		onApply({
			area: Math.round(finalArea * 100) / 100,
			calculationData: {
				method: "WALL_DEDUCTION",
				wallPerimeter,
				wallHeight,
				wallArea,
				includeCeiling,
				ceilingArea: includeCeiling ? ceilingArea : 0,
				deductions: openings
					.filter((o) => o.count > 0)
					.map((o) => ({
						type: o.type,
						width: o.width,
						height: o.height,
						count: o.count,
						area: o.width * o.height * o.count,
					})),
				totalDeductions,
				netArea: totalWithCeiling,
				wastagePercent,
				finalArea,
			},
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("wallDeduction")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Wall dimensions */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("wallPerimeter")} (م.ط)</Label>
							<Input
								type="number"
								value={wallPerimeter || ""}
								onChange={(e) => setWallPerimeter(parseFloat(e.target.value) || 0)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("wallHeight")} (م)</Label>
							<Input
								type="number"
								value={wallHeight || ""}
								onChange={(e) => setWallHeight(parseFloat(e.target.value) || 0)}
							/>
						</div>
					</div>

					<div className="rounded-lg bg-muted/50 p-2 text-sm">
						{t("wallArea")}: <span className="font-medium">{wallArea.toFixed(2)} م²</span>
					</div>

					{/* Ceiling area */}
					<div className="flex items-center gap-3 rounded-lg border p-3">
						<Checkbox
							id="include-ceiling"
							checked={includeCeiling}
							onCheckedChange={(checked) => setIncludeCeiling(checked === true)}
						/>
						<Label htmlFor="include-ceiling" className="flex-1 text-sm">
							{t("includeCeiling")}
						</Label>
						{includeCeiling && (
							<Input
								type="number"
								className="w-28 h-8"
								value={ceilingArea || ""}
								onChange={(e) => setCeilingArea(parseFloat(e.target.value) || 0)}
								placeholder="م²"
							/>
						)}
					</div>

					{/* Deductions */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">{t("deductions")}</Label>
						<div className="space-y-2">
							{openings.map((opening) => (
								<div
									key={opening.id}
									className="flex items-center gap-2 text-sm"
								>
									<span className="w-24 truncate text-xs">
										{opening.type === "custom"
											? t("customOpening")
											: t(opening.type as "standardDoor")}
									</span>
									{opening.type === "custom" ? (
										<>
											<Input
												type="number"
												className="w-16 h-7 text-xs"
												value={opening.width || ""}
												onChange={(e) =>
													updateOpening(opening.id, "width", parseFloat(e.target.value) || 0)
												}
												placeholder="W"
											/>
											<span className="text-xs">×</span>
											<Input
												type="number"
												className="w-16 h-7 text-xs"
												value={opening.height || ""}
												onChange={(e) =>
													updateOpening(opening.id, "height", parseFloat(e.target.value) || 0)
												}
												placeholder="H"
											/>
										</>
									) : (
										<span className="w-[8.5rem] text-xs text-muted-foreground">
											{opening.width}×{opening.height}
										</span>
									)}
									<Input
										type="number"
										className="w-14 h-7 text-xs"
										value={opening.count || ""}
										onChange={(e) =>
											updateOpening(opening.id, "count", parseInt(e.target.value) || 0)
										}
										placeholder="عدد"
									/>
									<span className="w-16 text-xs text-end">
										{(opening.width * opening.height * opening.count).toFixed(1)} م²
									</span>
									{opening.type === "custom" && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={() => removeOpening(opening.id)}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									)}
								</div>
							))}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={addCustomOpening}
							className="text-xs"
						>
							<Plus className="h-3 w-3 me-1" />
							{t("addOpening")}
						</Button>
					</div>

					{/* Summary */}
					<div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
						<div className="flex justify-between">
							<span>{t("wallArea")}:</span>
							<span>{wallArea.toFixed(2)} م²</span>
						</div>
						{includeCeiling && (
							<div className="flex justify-between">
								<span>{t("ceilingArea")}:</span>
								<span>+ {ceilingArea.toFixed(2)} م²</span>
							</div>
						)}
						<div className="flex justify-between text-destructive">
							<span>{t("totalDeductions")}:</span>
							<span>− {totalDeductions.toFixed(2)} م²</span>
						</div>
						<div className="flex justify-between border-t pt-1 font-medium">
							<span>{t("netArea")}:</span>
							<span>{totalWithCeiling.toFixed(2)} م²</span>
						</div>
						{wastagePercent > 0 && (
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>+ هالك {wastagePercent}%:</span>
								<span>+ {wastageAmount.toFixed(2)} م²</span>
							</div>
						)}
						<div className="flex justify-between border-t pt-1 text-base font-bold">
							<span>{t("totalArea")}:</span>
							<span>{finalArea.toFixed(2)} م²</span>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button onClick={handleApply}>{t("apply")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
