"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Building2 } from "lucide-react";
import type { StructuralFloorConfig } from "../../types/structural-building-config";

interface StructuralBuildingConfigBarProps {
	floors: StructuralFloorConfig[];
	onEdit: () => void;
}

export function StructuralBuildingConfigBar({
	floors,
	onEdit,
}: StructuralBuildingConfigBarProps) {
	const enabledFloors = floors
		.filter((f) => f.enabled)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	if (enabledFloors.length === 0) return null;

	return (
		<div className="flex items-center gap-3 bg-muted/30 border rounded-lg px-4 py-2">
			<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
			<div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
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
			</div>
			<Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
				<Pencil className="h-3 w-3 ml-1" />
				تعديل
			</Button>
		</div>
	);
}
