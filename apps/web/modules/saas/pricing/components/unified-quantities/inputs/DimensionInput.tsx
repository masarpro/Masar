"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { useEffect, useState } from "react";

interface Props {
	label: string;
	value: number | null | undefined;
	unit?: string;
	onCommit: (value: number) => void;
	min?: number;
	max?: number;
	precision?: number;
	id?: string;
	disabled?: boolean;
}

export function DimensionInput({
	label,
	value,
	unit,
	onCommit,
	min = 0,
	max,
	precision = 2,
	id,
	disabled,
}: Props) {
	const [local, setLocal] = useState(() =>
		value != null ? Number(value).toFixed(precision) : "",
	);
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) {
			setLocal(value != null ? Number(value).toFixed(precision) : "");
		}
	}, [value, precision, focused]);

	const commit = () => {
		setFocused(false);
		if (local.trim() === "") {
			onCommit(0);
			return;
		}
		const parsed = Number.parseFloat(local.replace(/,/g, ""));
		if (Number.isFinite(parsed) && parsed !== Number(value ?? 0)) {
			let clamped = parsed;
			if (min !== undefined) clamped = Math.max(min, clamped);
			if (max !== undefined) clamped = Math.min(max, clamped);
			onCommit(clamped);
		} else if (!Number.isFinite(parsed)) {
			setLocal(value != null ? Number(value).toFixed(precision) : "");
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
					className="pe-14 tabular-nums"
					disabled={disabled}
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
