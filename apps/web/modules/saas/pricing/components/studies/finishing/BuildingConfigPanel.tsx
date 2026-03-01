"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
import { ChevronDown, ChevronUp, Plus, Save, Settings, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { BuildingConfig, FloorConfig, FloorType } from "../../../lib/finishing-types";
import {
	DEFAULT_FLOOR_HEIGHTS,
	DEFAULT_FLOOR_NAMES,
	getTotalBuildingArea,
} from "../../../lib/finishing-types";
import { formatNumber } from "../../../lib/utils";

interface BuildingConfigPanelProps {
	organizationId: string;
	studyId: string;
	initialConfig?: BuildingConfig | null;
}

function createDefaultFloor(type: FloorType, existingFloors: FloorConfig[]): FloorConfig {
	let name = DEFAULT_FLOOR_NAMES[type];
	if (type === "UPPER") {
		const upperCount = existingFloors.filter((f) => f.floorType === "UPPER").length;
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

export function BuildingConfigPanel({
	organizationId,
	studyId,
	initialConfig,
}: BuildingConfigPanelProps) {
	const t = useTranslations("pricing.studies.finishing.buildingConfig");
	const queryClient = useQueryClient();
	const [isExpanded, setIsExpanded] = useState(!initialConfig);
	const [config, setConfig] = useState<BuildingConfig>(
		initialConfig ?? {
			totalLandArea: 0,
			buildingPerimeter: 0,
			floors: [],
		},
	);

	const saveMutation = useMutation(
		orpc.pricing.studies.buildingConfig.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("saved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
			onError: () => {
				toast.error(t("saveError"));
			},
		}),
	);

	const addFloor = useCallback((type: FloorType) => {
		setConfig((prev) => ({
			...prev,
			floors: [...prev.floors, createDefaultFloor(type, prev.floors)],
		}));
	}, []);

	const updateFloor = useCallback(
		(floorId: string, field: keyof FloorConfig, value: string | number | boolean) => {
			setConfig((prev) => ({
				...prev,
				floors: prev.floors.map((f) =>
					f.id === floorId ? { ...f, [field]: value } : f,
				),
			}));
		},
		[],
	);

	const removeFloor = useCallback((floorId: string) => {
		setConfig((prev) => ({
			...prev,
			floors: prev.floors.filter((f) => f.id !== floorId),
		}));
	}, []);

	const handleSave = () => {
		saveMutation.mutate({
			organizationId,
			costStudyId: studyId,
			buildingConfig: config,
		});
	};

	const totalBuildingArea = getTotalBuildingArea(config);

	return (
		<Card>
			<CardHeader
				className="cursor-pointer select-none"
				onClick={() => setIsExpanded((v) => !v)}
			>
				<CardTitle className="flex items-center justify-between text-base">
					<span className="flex items-center gap-2">
						<Settings className="h-4 w-4" />
						{t("title")}
					</span>
					<div className="flex items-center gap-3">
						{!isExpanded && config.floors.length > 0 && (
							<span className="text-sm font-normal text-muted-foreground">
								{config.floors.length} {t("floors")} • {formatNumber(totalBuildingArea)} م²
							</span>
						)}
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</div>
				</CardTitle>
			</CardHeader>

			{isExpanded && (
				<CardContent className="space-y-4">
					{/* Top-level inputs */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label className="text-sm">{t("totalLandArea")} (م²)</Label>
							<Input
								type="number"
								value={config.totalLandArea || ""}
								onChange={(e) =>
									setConfig((prev) => ({
										...prev,
										totalLandArea: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("buildingPerimeter")} (م)</Label>
							<Input
								type="number"
								value={config.buildingPerimeter || ""}
								onChange={(e) =>
									setConfig((prev) => ({
										...prev,
										buildingPerimeter: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>
					</div>

					{/* Floors table */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">{t("floors")}</Label>
						{config.floors.length > 0 && (
							<div className="space-y-2">
								{config.floors.map((floor, index) => (
									<div
										key={floor.id}
										className="flex items-center gap-2 rounded-lg border p-2"
									>
										<span className="w-6 text-center text-xs text-muted-foreground">
											{index + 1}
										</span>
										<Input
											value={floor.name}
											onChange={(e) =>
												updateFloor(floor.id, "name", e.target.value)
											}
											className="h-8 flex-1 text-sm"
											placeholder={t("floorName")}
										/>
										<Input
											type="number"
											value={floor.area || ""}
											onChange={(e) =>
												updateFloor(floor.id, "area", parseFloat(e.target.value) || 0)
											}
											className="h-8 w-24 text-sm"
											placeholder="م²"
										/>
										<Input
											type="number"
											value={floor.height || ""}
											onChange={(e) =>
												updateFloor(floor.id, "height", parseFloat(e.target.value) || 0)
											}
											className="h-8 w-20 text-sm"
											placeholder="م"
										/>
										<Select
											value={floor.floorType}
											onValueChange={(v) =>
												updateFloor(floor.id, "floorType", v)
											}
										>
											<SelectTrigger className="h-8 w-28 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{(
													[
														"BASEMENT",
														"GROUND",
														"UPPER",
														"ANNEX",
														"ROOF",
														"MEZZANINE",
													] as FloorType[]
												).map((type) => (
													<SelectItem key={type} value={type}>
														{t(`floorTypes.${type}`)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<div className="flex items-center gap-1">
											<Switch
												checked={floor.isRepeated}
												onCheckedChange={(checked) => {
													updateFloor(floor.id, "isRepeated", checked);
													if (!checked) {
														updateFloor(floor.id, "repeatCount", 1);
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
															Math.max(1, parseInt(e.target.value) || 1),
														)
													}
													className="h-8 w-14 text-xs"
													min={1}
												/>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 shrink-0"
											onClick={() => removeFloor(floor.id)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Add floor buttons */}
						<div className="flex flex-wrap gap-1">
							{(
								[
									"BASEMENT",
									"GROUND",
									"UPPER",
									"ANNEX",
									"ROOF",
									"MEZZANINE",
								] as FloorType[]
							).map((type) => (
								<Button
									key={type}
									variant="outline"
									size="sm"
									className="text-xs"
									onClick={() => addFloor(type)}
								>
									<Plus className="h-3 w-3 me-1" />
									{t(`floorTypes.${type}`)}
								</Button>
							))}
						</div>
					</div>

					{/* Total area and save */}
					<div className="flex items-center justify-between rounded-lg bg-muted p-3">
						<div>
							<span className="text-sm text-muted-foreground">
								{t("totalBuildingArea")}:
							</span>{" "}
							<span className="font-bold">
								{formatNumber(totalBuildingArea)} م²
							</span>
						</div>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={saveMutation.isPending}
						>
							<Save className="h-4 w-4 me-1" />
							{t("save")}
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	);
}
