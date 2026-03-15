"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Building2, Ruler } from "lucide-react";
import type { StructuralFloorConfig, StructuralBuildingConfig } from "../../types/structural-building-config";
import { useHeightDerivation } from "../../hooks/useHeightDerivation";
import { formatNumber } from "../../lib/utils";

interface StructuralBuildingConfigBarProps {
	floors: StructuralFloorConfig[];
	onEdit: () => void;
	buildingConfig?: StructuralBuildingConfig | null;
}

export function StructuralBuildingConfigBar({
	floors,
	onEdit,
	buildingConfig,
}: StructuralBuildingConfigBarProps) {
	const enabledFloors = floors
		.filter((f) => f.enabled)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	const { derivedHeights } = useHeightDerivation(buildingConfig ?? null);

	if (enabledFloors.length === 0) return null;

	const isLevelsMode = buildingConfig?.heightProperties?.heightInputMode === "levels";

	return (
		<div className="flex items-center gap-3 bg-muted/30 border rounded-lg px-4 py-2">
			<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
			<div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
				{isLevelsMode && (
					<Badge variant="default" className="text-xs gap-1 bg-blue-600">
						<Ruler className="h-3 w-3" />
						مناسيب
					</Badge>
				)}
				{enabledFloors.map((floor) => (
					<Badge key={floor.id} variant="secondary" className="text-xs gap-1">
						<span>{floor.icon}</span>
						<span>{floor.label}</span>
						{floor.height > 0 && (
							<span className="text-muted-foreground">({floor.height}م)</span>
						)}
						{floor.isRepeated && floor.repeatCount > 1 && (
							<span className="text-muted-foreground">×{floor.repeatCount}</span>
						)}
					</Badge>
				))}
				{/* Derived info compact display */}
				{derivedHeights && (
					<>
						{derivedHeights.neckHeight != null && (
							<Badge variant="outline" className="text-xs gap-1">
								رقبة: {formatNumber(derivedHeights.neckHeight)} سم
							</Badge>
						)}
						{derivedHeights.parapet && (
							<Badge variant="outline" className="text-xs gap-1">
								دروة: {formatNumber(derivedHeights.parapet.blockHeight)} سم
							</Badge>
						)}
					</>
				)}
			</div>
			<Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
				<Pencil className="h-3 w-3 ml-1" />
				تعديل
			</Button>
		</div>
	);
}
