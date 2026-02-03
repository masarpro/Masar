"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Label } from "@ui/components/label";

interface StirrupsInputProps {
	diameter: number;
	onDiameterChange: (d: number) => void;
	spacing: number;
	onSpacingChange: (s: number) => void;
	title?: string;
	availableDiameters?: number[];
	availableSpacings?: number[];
	className?: string;
}

const DEFAULT_STIRRUP_DIAMETERS = [8, 10];
const DEFAULT_SPACINGS = [100, 125, 150, 175, 200, 250, 300];

export function StirrupsInput({
	diameter,
	onDiameterChange,
	spacing,
	onSpacingChange,
	title = "الكانات",
	availableDiameters = DEFAULT_STIRRUP_DIAMETERS,
	availableSpacings = DEFAULT_SPACINGS,
	className,
}: StirrupsInputProps) {
	return (
		<div
			className={`rounded-lg p-3 border bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 ${className || ""}`}
		>
			{/* Header */}
			<div className="font-medium text-sm mb-3 text-amber-700 dark:text-amber-300">
				{title}
			</div>

			{/* Inputs Row */}
			<div className="grid grid-cols-2 gap-3">
				{/* Diameter Select */}
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">قطر الكانة</Label>
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

				{/* Spacing Select */}
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">التباعد (مم)</Label>
					<Select
						value={spacing.toString()}
						onValueChange={(v) => onSpacingChange(parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableSpacings.map((s) => (
								<SelectItem key={s} value={s.toString()}>
									{s} مم
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
