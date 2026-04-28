"use client";

import { Input } from "@ui/components/input";
import { Search } from "lucide-react";

interface Props {
	value: string;
	onChange: (value: string) => void;
}

export function CatalogSearch({ value, onChange }: Props) {
	return (
		<div className="relative">
			<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="ابحث... (دهان، سيراميك، كهرباء، إلخ)"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="pe-10"
			/>
		</div>
	);
}
