"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { useTranslations } from "next-intl";
import type { SmartBuildingConfig } from "../../../lib/smart-building-types";
import { formatNumber } from "../../../lib/utils";

interface ExteriorStepProps {
	config: SmartBuildingConfig;
	onChange: (config: SmartBuildingConfig) => void;
}

export function ExteriorStep({ config, onChange }: ExteriorStepProps) {
	const tw = useTranslations("pricing.studies.finishing.wizard");

	const groundFloor = config.floors.find(
		(f) => f.floorType === "GROUND",
	);
	const largestArea = Math.max(
		...config.floors
			.filter((f) => f.floorType !== "ROOF")
			.map((f) => f.area),
		0,
	);
	const buildingFootprint = Math.max(groundFloor?.area ?? 0, largestArea);
	const courtyardArea = Math.max(
		0,
		config.totalLandArea - buildingFootprint,
	);
	const gardenArea =
		config.hasGarden && config.gardenPercentage
			? Math.round(courtyardArea * (config.gardenPercentage / 100))
			: 0;

	return (
		<div className="space-y-6">
			{/* Land perimeter */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label className="text-sm font-medium">
						محيط الأرض (م.ط)
					</Label>
					<Input
						type="number"
						value={config.landPerimeter || ""}
						onChange={(e) =>
							onChange({
								...config,
								landPerimeter:
									parseFloat(e.target.value) || 0,
							})
						}
						placeholder="اختياري"
					/>
					<p className="text-[11px] text-muted-foreground">
						لحساب مساحة السور والدهان الخارجي
					</p>
				</div>

				<div className="space-y-1.5">
					<Label className="text-sm font-medium">
						ارتفاع السور (م)
					</Label>
					<Input
						type="number"
						value={config.fenceHeight ?? 3}
						onChange={(e) =>
							onChange({
								...config,
								fenceHeight:
									parseFloat(e.target.value) || 3,
							})
						}
						step="0.5"
					/>
				</div>
			</div>

			{/* Courtyard */}
			<div className="space-y-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div>
						<Label className="text-sm font-medium">
							يوجد حوش
						</Label>
						{config.hasCourtyard !== false &&
							courtyardArea > 0 && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{tw("courtyardArea")}:{" "}
									<b>{formatNumber(courtyardArea, 0)} م²</b>
									<span className="text-[10px] ms-1">
										(أرض {config.totalLandArea} - مبنى{" "}
										{buildingFootprint})
									</span>
								</p>
							)}
					</div>
					<Switch
						checked={config.hasCourtyard !== false}
						onCheckedChange={(checked) =>
							onChange({
								...config,
								hasCourtyard: checked,
							})
						}
					/>
				</div>

				{/* Garden */}
				{config.hasCourtyard !== false && courtyardArea > 0 && (
					<div className="space-y-3 border-t pt-3">
						<div className="flex items-center justify-between">
							<div>
								<Label className="text-sm font-medium">
									يوجد حديقة
								</Label>
								{config.hasGarden && gardenArea > 0 && (
									<p className="text-xs text-muted-foreground mt-0.5">
										مساحة الحديقة:{" "}
										<b>
											{formatNumber(gardenArea, 0)} م²
										</b>
									</p>
								)}
							</div>
							<Switch
								checked={config.hasGarden === true}
								onCheckedChange={(checked) =>
									onChange({
										...config,
										hasGarden: checked,
										gardenPercentage: checked
											? config.gardenPercentage ?? 30
											: 0,
									})
								}
							/>
						</div>

						{config.hasGarden && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>نسبة الحديقة من الحوش</span>
									<span className="font-medium">
										{config.gardenPercentage ?? 0}%
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={100}
									step={5}
									value={config.gardenPercentage ?? 0}
									onChange={(e) =>
										onChange({
											...config,
											gardenPercentage: parseInt(
												e.target.value,
											),
										})
									}
									className="w-full accent-primary"
								/>
								<div className="flex justify-between text-[10px] text-muted-foreground">
									<span>0%</span>
									<span>50%</span>
									<span>100%</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
