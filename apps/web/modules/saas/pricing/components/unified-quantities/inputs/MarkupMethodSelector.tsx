"use client";

import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import type { MarkupMethod } from "../types";

interface Props {
	value: MarkupMethod;
	onChange: (method: MarkupMethod) => void;
}

const LABELS: Record<MarkupMethod, string> = {
	percentage: "نسبة مئوية (%)",
	fixed_amount: "مبلغ ثابت (ر.س)",
	manual_price: "سعر يدوي",
};

export function MarkupMethodSelector({ value, onChange }: Props) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">طريقة الربح</Label>
			<Select value={value} onValueChange={(v) => onChange(v as MarkupMethod)}>
				<SelectTrigger className="h-9">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{(Object.keys(LABELS) as MarkupMethod[]).map((method) => (
						<SelectItem key={method} value={method}>
							{LABELS[method]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
