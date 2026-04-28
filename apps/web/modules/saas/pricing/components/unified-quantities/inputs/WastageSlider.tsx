"use client";

import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";

interface Props {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

export function WastageSlider({
	value,
	onChange,
	min = 0,
	max = 30,
	step = 1,
}: Props) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">نسبة الهدر</Label>
				<span className="text-xs font-medium tabular-nums">{value}%</span>
			</div>
			<Slider
				value={[value]}
				onValueChange={(v) => onChange(v[0] ?? 0)}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
}
