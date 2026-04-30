"use client";

import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import type { QuoteData } from "./types";

interface Props {
	value: QuoteData;
	onChange: (next: QuoteData) => void;
}

export function QuoteTermsEditor({ value, onChange }: Props) {
	const set = <K extends keyof QuoteData>(key: K, v: QuoteData[K]) =>
		onChange({ ...value, [key]: v });

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="q-pay" className="text-sm">
					شروط الدفع
				</Label>
				<Textarea
					id="q-pay"
					rows={3}
					value={value.paymentTerms}
					onChange={(e) => set("paymentTerms", e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="q-exec" className="text-sm">
					مدة التنفيذ
				</Label>
				<Textarea
					id="q-exec"
					rows={2}
					value={value.executionDuration}
					onChange={(e) => set("executionDuration", e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="q-warr" className="text-sm">
					شروط الضمان
				</Label>
				<Textarea
					id="q-warr"
					rows={2}
					value={value.warranty}
					onChange={(e) => set("warranty", e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="q-notes" className="text-sm">
					ملاحظات إضافية
				</Label>
				<Textarea
					id="q-notes"
					rows={3}
					value={value.notes}
					onChange={(e) => set("notes", e.target.value)}
					placeholder="اختياري"
				/>
			</div>
		</div>
	);
}
