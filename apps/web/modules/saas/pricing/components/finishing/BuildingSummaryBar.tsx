"use client";

import { Button } from "@ui/components/button";
import { Building2, Layers, Bath, Trees, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import { getTotalBuildingArea } from "../../lib/finishing-types";
import { formatNumber } from "../../lib/utils";

interface BuildingSummaryBarProps {
	config: SmartBuildingConfig | null;
	onEditConfig: () => void;
}

export const BuildingSummaryBar = memo(function BuildingSummaryBar({
	config,
	onEditConfig,
}: BuildingSummaryBarProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");

	if (!config || !config.floors?.length) {
		return (
			<div className="rounded-xl border border-dashed bg-muted/30 p-4 flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{t("noConfig")}
				</span>
				<Button variant="outline" size="sm" onClick={onEditConfig}>
					<Settings className="h-3.5 w-3.5 me-1.5" />
					{t("setupBuilding")}
				</Button>
			</div>
		);
	}

	const totalArea = getTotalBuildingArea(config);
	const habitableFloors = config.floors.filter(
		(f) => f.floorType !== "ROOF",
	);
	const hasRoof = config.floors.some((f) => f.floorType === "ROOF");
	const allRooms = config.floors.flatMap((f) => f.rooms ?? []);
	const bathroomCount = allRooms.filter(
		(r) => r.type === "bathroom",
	).length;

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

	return (
		<div className="rounded-xl border bg-card shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
			<Stat
				icon={<Building2 className="h-4 w-4" />}
				label={t("buildingArea")}
				value={`${formatNumber(totalArea, 0)} م²`}
			/>
			<div className="w-px h-8 bg-border hidden sm:block" />
			<Stat
				icon={<Layers className="h-4 w-4" />}
				label={t("floors")}
				value={`${habitableFloors.length}${hasRoof ? " + سطح" : ""}`}
			/>
			{bathroomCount > 0 && (
				<>
					<div className="w-px h-8 bg-border hidden sm:block" />
					<Stat
						icon={<Bath className="h-4 w-4" />}
						label={t("bathrooms")}
						value={`${bathroomCount}`}
					/>
				</>
			)}
			{courtyardArea > 0 && (
				<>
					<div className="w-px h-8 bg-border hidden sm:block" />
					<Stat
						icon={<Trees className="h-4 w-4" />}
						label={t("courtyard")}
						value={`${formatNumber(courtyardArea, 0)} م²`}
					/>
				</>
			)}
			<div className="ms-auto">
				<Button
					variant="ghost"
					size="sm"
					onClick={onEditConfig}
					className="text-sm"
				>
					<Settings className="h-3.5 w-3.5 me-1.5" />
					{t("editSettings")}
				</Button>
			</div>
		</div>
	);
});

function Stat({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground">{icon}</span>
			<span className="text-sm text-muted-foreground">{label}:</span>
			<span className="text-lg font-bold tabular-nums" dir="ltr">{value}</span>
		</div>
	);
}
