"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { useEffect, useState } from "react";

interface Props {
	label: string;
	value: number;
	unit?: string;
	onChange: (value: number) => void;
	isLoading?: boolean;
	precision?: number;
	min?: number;
	max?: number;
	disabled?: boolean;
	id?: string;
}

export function BiDirectionalPriceInput({
	label,
	value,
	unit,
	onChange,
	isLoading,
	precision = 2,
	min = 0,
	max,
	disabled,
	id,
}: Props) {
	const [local, setLocal] = useState(() => value.toFixed(precision));
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setLocal(value.toFixed(precision));
	}, [value, precision, focused]);

	const commit = () => {
		setFocused(false);
		const parsed = Number.parseFloat(local.replace(/,/g, ""));
		if (Number.isFinite(parsed) && parsed !== value) {
			let clamped = parsed;
			if (min !== undefined) clamped = Math.max(min, clamped);
			if (max !== undefined) clamped = Math.min(max, clamped);
			onChange(clamped);
		} else if (!Number.isFinite(parsed)) {
			setLocal(value.toFixed(precision));
		}
	};

	return (
		<div className="space-y-1.5">
			<Label htmlFor={id} className="text-xs text-muted-foreground">
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="text"
					inputMode="decimal"
					value={local}
					onChange={(e) => setLocal(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							(e.target as HTMLInputElement).blur();
						}
					}}
					className={`pe-14 tabular-nums ${isLoading ? "opacity-60" : ""}`}
					disabled={disabled || isLoading}
				/>
				{unit && (
					<span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
						{unit}
					</span>
				)}
			</div>
		</div>
	);
}
