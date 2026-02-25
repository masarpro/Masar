"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Label } from "@ui/components/label";
import { REBAR_DIAMETERS } from "../../../constants/prices";

interface RebarMeshInputProps {
	title: string;
	direction?: string;
	diameter: number;
	onDiameterChange: (d: number) => void;
	barsPerMeter: number;
	onBarsPerMeterChange: (n: number) => void;
	colorScheme?: "blue" | "green" | "gray";
	availableDiameters?: number[];
	availableBarsPerMeter?: number[];
	className?: string;
}

const COLOR_SCHEMES = {
	blue: {
		bg: "bg-blue-50 dark:bg-blue-950",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-700 dark:text-blue-300",
	},
	green: {
		bg: "bg-green-50 dark:bg-green-950",
		border: "border-green-200 dark:border-green-800",
		text: "text-green-700 dark:text-green-300",
	},
	gray: {
		bg: "bg-muted/50",
		border: "border-border",
		text: "text-foreground",
	},
};

const DEFAULT_BARS_PER_METER = [3, 4, 5, 6, 7, 8, 10];

export function RebarMeshInput({
	title,
	direction,
	diameter,
	onDiameterChange,
	barsPerMeter,
	onBarsPerMeterChange,
	colorScheme = "gray",
	availableDiameters = REBAR_DIAMETERS.filter((d) => d >= 10),
	availableBarsPerMeter = DEFAULT_BARS_PER_METER,
	className,
}: RebarMeshInputProps) {
	const colors = COLOR_SCHEMES[colorScheme];
	const spacing = barsPerMeter > 0 ? Math.round(100 / barsPerMeter) : 0;

	return (
		<div
			className={`rounded-lg p-3 border ${colors.bg} ${colors.border} ${className || ""}`}
		>
			{/* Header */}
			<div className={`font-medium text-sm mb-3 ${colors.text}`}>
				{title}
				{direction && (
					<span className="text-muted-foreground font-normal ms-1">
						({direction})
					</span>
				)}
			</div>

			{/* Inputs Row */}
			<div className="grid grid-cols-2 gap-3">
				{/* Diameter Select */}
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">قطر السيخ</Label>
					<Select
						value={diameter.toString()}
						onValueChange={(v) => onDiameterChange(parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableDiameters.map((d) => (
								<SelectItem key={d} value={d.toString()}>
									{d} مم
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Bars Per Meter Select */}
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">عدد الأسياخ/م</Label>
					<Select
						value={barsPerMeter.toString()}
						onValueChange={(v) => onBarsPerMeterChange(parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableBarsPerMeter.map((n) => (
								<SelectItem key={n} value={n.toString()}>
									{n} سيخ/م
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Calculated Spacing */}
			{spacing > 0 && (
				<div className="mt-2 text-xs text-muted-foreground text-center">
					التباعد: {spacing} سم
				</div>
			)}
		</div>
	);
}
