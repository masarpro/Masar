"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { SmartBuildingConfig, SmartFloorConfig, FloorType } from "../../../lib/smart-building-types";
import {
	DEFAULT_FLOOR_HEIGHTS,
	DEFAULT_FLOOR_NAMES,
	getTotalBuildingArea,
} from "../../../lib/finishing-types";
import { formatNumber } from "../../../lib/utils";

interface BuildingStructureStepProps {
	config: SmartBuildingConfig;
	onChange: (config: SmartBuildingConfig) => void;
}

function createDefaultFloor(
	type: FloorType,
	existingFloors: SmartFloorConfig[],
): SmartFloorConfig {
	let name = DEFAULT_FLOOR_NAMES[type];
	if (type === "UPPER") {
		const upperCount = existingFloors.filter(
			(f) => f.floorType === "UPPER",
		).length;
		const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];
		name = `الدور ${ordinals[upperCount] ?? `العلوي ${upperCount + 1}`}`;
	}
	return {
		id: crypto.randomUUID(),
		name,
		area: 0,
		height: DEFAULT_FLOOR_HEIGHTS[type],
		sortOrder: existingFloors.length,
		isRepeated: false,
		repeatCount: 1,
		floorType: type,
	};
}

const FLOOR_TYPES: FloorType[] = [
	"BASEMENT",
	"GROUND",
	"UPPER",
	"ANNEX",
	"ROOF",
	"MEZZANINE",
];

export function BuildingStructureStep({
	config,
	onChange,
}: BuildingStructureStepProps) {
	const t = useTranslations("pricing.studies.finishing.buildingConfig");
	const tw = useTranslations("pricing.studies.finishing.wizard");

	const addFloor = useCallback(
		(type: FloorType) => {
			onChange({
				...config,
				floors: [
					...config.floors,
					createDefaultFloor(type, config.floors),
				],
			});
		},
		[config, onChange],
	);

	const updateFloor = useCallback(
		(
			floorId: string,
			field: keyof SmartFloorConfig,
			value: string | number | boolean,
		) => {
			onChange({
				...config,
				floors: config.floors.map((f) =>
					f.id === floorId ? { ...f, [field]: value } : f,
				),
			});
		},
		[config, onChange],
	);

	const removeFloor = useCallback(
		(floorId: string) => {
			onChange({
				...config,
				floors: config.floors.filter((f) => f.id !== floorId),
			});
		},
		[config, onChange],
	);

	const totalBuildingArea = getTotalBuildingArea(config);
	const floorCount = config.floors.filter(
		(f) => f.floorType !== "ROOF",
	).length;
	const totalHeight = config.floors
		.filter((f) => f.floorType !== "ROOF")
		.reduce(
			(sum, f) => sum + f.height * (f.isRepeated ? f.repeatCount : 1),
			0,
		);

	return (
		<div className="space-y-6">
			{/* Top-level inputs */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label className="text-sm font-medium">
						{t("totalLandArea")} (م²)
					</Label>
					<Input
						type="number"
						value={config.totalLandArea || ""}
						onChange={(e) =>
							onChange({
								...config,
								totalLandArea: parseFloat(e.target.value) || 0,
							})
						}
						placeholder="مثال: 600"
					/>
				</div>
				<div className="space-y-1.5">
					<TooltipProvider>
						<div className="flex items-center gap-1.5">
							<Label className="text-sm font-medium">
								{t("buildingPerimeter")} (م.ط)
							</Label>
							<Tooltip>
								<TooltipTrigger asChild>
									<HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-60 text-sm">
									مجموع أطوال الأضلاع الخارجية للمبنى
								</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
					<Input
						type="number"
						value={config.buildingPerimeter || ""}
						onChange={(e) =>
							onChange({
								...config,
								buildingPerimeter:
									parseFloat(e.target.value) || 0,
							})
						}
						placeholder="مثال: 52"
					/>
				</div>
			</div>

			{/* Floors */}
			<div className="space-y-3">
				<Label className="text-sm font-medium">{t("floors")}</Label>

				{config.floors.length > 0 && (
					<div className="space-y-2.5">
						{config.floors.map((floor, index) => (
							<div
								key={floor.id}
								className="flex flex-wrap items-center gap-2.5 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow duration-200"
							>
								<span className="w-6 text-center text-xs text-muted-foreground font-medium">
									{index + 1}
								</span>
								<Input
									value={floor.name}
									onChange={(e) =>
										updateFloor(
											floor.id,
											"name",
											e.target.value,
										)
									}
									className="h-9 flex-1 min-w-[120px] text-sm"
									placeholder={t("floorName")}
								/>
								<div className="flex items-center gap-1">
									<Input
										type="number"
										value={floor.area || ""}
										onChange={(e) =>
											updateFloor(
												floor.id,
												"area",
												parseFloat(e.target.value) || 0,
											)
										}
										className="h-9 w-24 text-sm"
										placeholder="م²"
									/>
									<span className="text-xs text-muted-foreground">
										م²
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Input
										type="number"
										value={floor.height || ""}
										onChange={(e) =>
											updateFloor(
												floor.id,
												"height",
												parseFloat(e.target.value) || 0,
											)
										}
										className="h-9 w-20 text-sm"
										placeholder="م"
									/>
									<span className="text-xs text-muted-foreground">
										م
									</span>
								</div>
								<Select
									value={floor.floorType}
									onValueChange={(v) =>
										updateFloor(floor.id, "floorType", v)
									}
								>
									<SelectTrigger className="h-9 w-28 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{FLOOR_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{t(`floorTypes.${type}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className="flex items-center gap-1.5">
									<Switch
										checked={floor.isRepeated}
										onCheckedChange={(checked) => {
											updateFloor(
												floor.id,
												"isRepeated",
												checked,
											);
											if (!checked) {
												updateFloor(
													floor.id,
													"repeatCount",
													1,
												);
											}
										}}
										className="scale-75"
									/>
									{floor.isRepeated && (
										<Input
											type="number"
											value={floor.repeatCount}
											onChange={(e) =>
												updateFloor(
													floor.id,
													"repeatCount",
													Math.max(
														1,
														parseInt(
															e.target.value,
														) || 1,
													),
												)
											}
											className="h-9 w-14 text-xs"
											min={1}
										/>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
									onClick={() => removeFloor(floor.id)}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						))}
					</div>
				)}

				{/* Add floor buttons */}
				<div className="flex flex-wrap gap-2">
					{FLOOR_TYPES.map((type) => (
						<Button
							key={type}
							variant="outline"
							size="sm"
							className="text-sm rounded-lg"
							onClick={() => addFloor(type)}
						>
							<Plus className="h-3.5 w-3.5 me-1.5" />
							{t(`floorTypes.${type}`)}
						</Button>
					))}
				</div>
			</div>

			{/* Summary */}
			{config.floors.length > 0 && (
				<div className="rounded-xl bg-muted/40 border p-5">
					<div className="grid grid-cols-3 gap-4 text-center">
						<div>
							<div className="text-sm text-muted-foreground">
								{tw("totalBuildingArea")}
							</div>
							<div className="text-xl font-bold mt-1 tabular-nums" dir="ltr">
								{formatNumber(totalBuildingArea, 0)} م²
							</div>
						</div>
						<div className="border-x border-border">
							<div className="text-sm text-muted-foreground">
								{tw("floorCount")}
							</div>
							<div className="text-xl font-bold mt-1 tabular-nums">
								{floorCount}
							</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">
								{tw("totalHeight")}
							</div>
							<div className="text-xl font-bold mt-1 tabular-nums" dir="ltr">
								{formatNumber(totalHeight, 1)} م
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
