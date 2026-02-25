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

interface RebarBarsInputProps {
	title: string;
	diameter: number;
	onDiameterChange: (d: number) => void;
	barsCount: number;
	onBarsCountChange: (n: number) => void;
	colorScheme?: "blue" | "green" | "indigo" | "gray";
	availableDiameters?: number[];
	availableBarsCount?: number[];
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
	indigo: {
		bg: "bg-indigo-50 dark:bg-indigo-950",
		border: "border-indigo-200 dark:border-indigo-800",
		text: "text-indigo-700 dark:text-indigo-300",
	},
	gray: {
		bg: "bg-muted/50",
		border: "border-border",
		text: "text-foreground",
	},
};

const DEFAULT_BARS_COUNT = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16];

export function RebarBarsInput({
	title,
	diameter,
	onDiameterChange,
	barsCount,
	onBarsCountChange,
	colorScheme = "gray",
	availableDiameters = REBAR_DIAMETERS.filter((d) => d >= 12),
	availableBarsCount = DEFAULT_BARS_COUNT,
	className,
}: RebarBarsInputProps) {
	const colors = COLOR_SCHEMES[colorScheme];

	return (
		<div
			className={`rounded-lg p-3 border ${colors.bg} ${colors.border} ${className || ""}`}
		>
			{/* Header */}
			<div className={`font-medium text-sm mb-3 ${colors.text}`}>{title}</div>

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

				{/* Bars Count Select */}
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">عدد الأسياخ</Label>
					<Select
						value={barsCount.toString()}
						onValueChange={(v) => onBarsCountChange(parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableBarsCount.map((n) => (
								<SelectItem key={n} value={n.toString()}>
									{n} أسياخ
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
