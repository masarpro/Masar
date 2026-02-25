"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Ruler } from "lucide-react";
import { formatNumber } from "../../../lib/utils";

interface DimensionConfig {
	key: string;
	label: string;
	value: number;
	unit: string;
	step?: number;
	min?: number;
	max?: number;
}

interface DimensionsCardProps {
	dimensions: DimensionConfig[];
	onDimensionChange: (key: string, value: number) => void;
	calculatedVolume?: number;
	volumeUnit?: string;
	calculatedArea?: number;
	areaUnit?: string;
	title?: string;
	className?: string;
}

export function DimensionsCard({
	dimensions,
	onDimensionChange,
	calculatedVolume,
	volumeUnit = "م³",
	calculatedArea,
	areaUnit = "م²",
	title = "أبعاد العنصر",
	className,
}: DimensionsCardProps) {
	return (
		<div
			className={`bg-muted/30 rounded-lg p-4 border border-border ${className || ""}`}
		>
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<Ruler className="h-5 w-5 text-primary" />
				<h4 className="font-medium">{title}</h4>
			</div>

			{/* Dimensions Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
				{dimensions.map((dim) => (
					<div key={dim.key} className="space-y-1.5">
						<Label className="text-sm text-muted-foreground">
							{dim.label} ({dim.unit})
						</Label>
						<Input
							type="number"
							value={dim.value || ""}
							onChange={(e) =>
								onDimensionChange(dim.key, parseFloat(e.target.value) || 0)
							}
							step={dim.step || 0.1}
							min={dim.min || 0}
							max={dim.max}
							className="text-center"
						/>
					</div>
				))}

				{/* Volume/Area Display */}
				{(calculatedVolume !== undefined || calculatedArea !== undefined) && (
					<div className="bg-primary/10 rounded-lg p-3 flex flex-col justify-center items-center border border-primary/20">
						{calculatedVolume !== undefined && (
							<>
								<span className="text-xs text-muted-foreground">الحجم</span>
								<span className="font-bold text-lg text-primary">
									{formatNumber(calculatedVolume)} {volumeUnit}
								</span>
							</>
						)}
						{calculatedArea !== undefined && (
							<>
								<span className="text-xs text-muted-foreground">المساحة</span>
								<span className="font-bold text-lg text-primary">
									{formatNumber(calculatedArea)} {areaUnit}
								</span>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
