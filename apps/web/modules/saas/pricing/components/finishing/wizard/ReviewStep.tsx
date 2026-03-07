"use client";

import { Badge } from "@ui/components/badge";
import {
	Bath,
	Building2,
	ChefHat,
	DoorOpen,
	Home,
	Layers,
	Ruler,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { SmartBuildingConfig } from "../../../lib/smart-building-types";
import { deriveAllQuantities } from "../../../lib/derivation-engine";
import { formatNumber } from "../../../lib/utils";
import { getTotalBuildingArea } from "../../../lib/finishing-types";

interface ReviewStepProps {
	config: SmartBuildingConfig;
}

export function ReviewStep({ config }: ReviewStepProps) {
	const tw = useTranslations("pricing.studies.finishing.wizard");

	const totalBuildingArea = getTotalBuildingArea(config);
	const habitableFloors = config.floors.filter(
		(f) => f.floorType !== "ROOF",
	);
	const totalHeight = habitableFloors.reduce(
		(sum, f) => sum + f.height * (f.isRepeated ? f.repeatCount : 1),
		0,
	);

	const allRooms = config.floors.flatMap((f) => f.rooms ?? []);
	const allOpenings = config.floors.flatMap((f) => f.openings ?? []);
	const bathroomCount = allRooms.filter(
		(r) => r.type === "bathroom",
	).length;
	const kitchenCount = allRooms.filter(
		(r) => r.type === "kitchen",
	).length;
	const doorCount = allOpenings
		.filter((o) => o.type === "door")
		.reduce((s, o) => s + o.count, 0);
	const windowCount = allOpenings
		.filter((o) => o.type === "window")
		.reduce((s, o) => s + o.count, 0);

	const groundFloor = config.floors.find(
		(f) => f.floorType === "GROUND",
	);
	const buildingFootprint = Math.max(
		groundFloor?.area ?? 0,
		...config.floors
			.filter((f) => f.floorType !== "ROOF")
			.map((f) => f.area),
	);
	const courtyardArea =
		config.hasCourtyard !== false
			? Math.max(0, config.totalLandArea - buildingFootprint)
			: 0;

	// Derive quantities to get count
	const derivedItems = deriveAllQuantities(config);
	const enabledCount = derivedItems.filter((d) => d.isEnabled).length;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Areas */}
				<div className="rounded-xl border bg-card p-5 space-y-3">
					<h3 className="text-sm font-semibold flex items-center gap-2">
						<Ruler className="h-4 w-4 text-muted-foreground" />
						المساحات
					</h3>
					<div className="space-y-2 text-sm">
						<Row
							label="مساحة الأرض"
							value={`${formatNumber(config.totalLandArea, 0)} م²`}
						/>
						<Row
							label={tw("totalBuildingArea")}
							value={`${formatNumber(totalBuildingArea, 0)} م²`}
						/>
						{courtyardArea > 0 && (
							<Row
								label={tw("courtyardArea")}
								value={`${formatNumber(courtyardArea, 0)} م²`}
							/>
						)}
						<div className="border-t pt-2 mt-2">
							<Row
								label={tw("totalHeight")}
								value={`${formatNumber(totalHeight, 1)} م`}
							/>
							{config.fenceHeight && config.landPerimeter ? (
								<Row
									label="ارتفاع السور"
									value={`${config.fenceHeight} م`}
								/>
							) : null}
						</div>
					</div>
				</div>

				{/* Details */}
				<div className="rounded-xl border bg-card p-5 space-y-3">
					<h3 className="text-sm font-semibold flex items-center gap-2">
						<Building2 className="h-4 w-4 text-muted-foreground" />
						التفاصيل
					</h3>
					<div className="space-y-2 text-sm">
						<Row
							label={tw("floorCount")}
							value={`${habitableFloors.length} دور`}
							icon={<Layers className="h-3.5 w-3.5" />}
						/>
						{allRooms.length > 0 && (
							<Row
								label={tw("roomCount")}
								value={`${allRooms.length} غرفة`}
								icon={<Home className="h-3.5 w-3.5" />}
							/>
						)}
						{bathroomCount > 0 && (
							<Row
								label={tw("bathroomCount")}
								value={`${bathroomCount}`}
								icon={<Bath className="h-3.5 w-3.5" />}
							/>
						)}
						{kitchenCount > 0 && (
							<Row
								label="المطابخ"
								value={`${kitchenCount}`}
								icon={<ChefHat className="h-3.5 w-3.5" />}
							/>
						)}
						{doorCount > 0 && (
							<Row
								label="الأبواب"
								value={`${doorCount}`}
								icon={<DoorOpen className="h-3.5 w-3.5" />}
							/>
						)}
						{windowCount > 0 && (
							<Row label="النوافذ" value={`${windowCount}`} />
						)}
					</div>
				</div>
			</div>

			{/* Generation preview */}
			<div className="rounded-xl bg-primary/5 border border-primary/20 p-5 text-center">
				<Badge variant="secondary" className="text-sm px-4 py-1.5 rounded-full">
					{tw("willGenerate", { count: enabledCount })}
				</Badge>
			</div>
		</div>
	);
}

function Row({
	label,
	value,
	icon,
}: {
	label: string;
	value: string;
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-muted-foreground flex items-center gap-1.5">
				{icon}
				{label}
			</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
