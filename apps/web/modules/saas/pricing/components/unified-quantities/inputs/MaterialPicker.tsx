"use client";

import { Button } from "@ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export interface CommonMaterial {
	nameAr: string;
	nameEn?: string;
	brand?: string;
	grade?: string;
	suggestedPrice?: number;
	source?: string;
}

interface Props {
	materials: CommonMaterial[] | null | undefined;
	value: { name?: string | null; brand?: string | null } | null;
	onSelect: (material: CommonMaterial) => void;
	disabled?: boolean;
}

export function MaterialPicker({ materials, value, onSelect, disabled }: Props) {
	const [open, setOpen] = useState(false);
	const list = Array.isArray(materials) ? materials : [];

	const display = value?.name
		? value.brand
			? `${value.name} — ${value.brand}`
			: value.name
		: "اختر مادة من المكتبة";

	if (list.length === 0) {
		return (
			<p className="text-xs text-muted-foreground">
				لا توجد ماركات شائعة لهذا البند — استخدم الحقول النصية بالأسفل.
			</p>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between text-start"
					disabled={disabled}
				>
					<span className="truncate text-sm">{display}</span>
					<ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
				<div className="max-h-72 overflow-auto p-1">
					{list.map((m, i) => {
						const isSelected =
							value?.name === m.nameAr && (value?.brand ?? null) === (m.brand ?? null);
						return (
							<button
								key={`${m.nameAr}-${m.brand ?? ""}-${i}`}
								type="button"
								onClick={() => {
									onSelect(m);
									setOpen(false);
								}}
								className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-accent"
							>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium">{m.nameAr}</div>
									<div className="truncate text-xs text-muted-foreground">
										{m.brand && <span>{m.brand}</span>}
										{m.brand && m.grade && <span> · </span>}
										{m.grade && <span>{m.grade}</span>}
										{m.suggestedPrice != null && (
											<span className="ms-1 tabular-nums text-emerald-600 dark:text-emerald-400">
												({m.suggestedPrice} ر.س)
											</span>
										)}
									</div>
								</div>
								{isSelected && (
									<Check className="h-4 w-4 flex-shrink-0 text-primary" />
								)}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
