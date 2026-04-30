"use client";

import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import type { QuoteData } from "./types";

interface Props {
	value: QuoteData;
	onChange: (next: QuoteData) => void;
}

export function QuoteSettingsForm({ value, onChange }: Props) {
	const set = <K extends keyof QuoteData>(key: K, v: QuoteData[K]) =>
		onChange({ ...value, [key]: v });

	return (
		<div className="space-y-5">
			<div>
				<h4 className="mb-3 text-sm font-semibold">معلومات العميل</h4>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="q-client-name" className="text-xs">
							اسم العميل
						</Label>
						<Input
							id="q-client-name"
							value={value.clientName}
							onChange={(e) => set("clientName", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-client-phone" className="text-xs">
							الهاتف
						</Label>
						<Input
							id="q-client-phone"
							value={value.clientPhone}
							onChange={(e) => set("clientPhone", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-client-email" className="text-xs">
							البريد الإلكتروني
						</Label>
						<Input
							id="q-client-email"
							type="email"
							value={value.clientEmail}
							onChange={(e) => set("clientEmail", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-client-addr" className="text-xs">
							العنوان
						</Label>
						<Input
							id="q-client-addr"
							value={value.clientAddress}
							onChange={(e) => set("clientAddress", e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div>
				<h4 className="mb-3 text-sm font-semibold">معلومات العرض</h4>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					<div className="space-y-1.5">
						<Label htmlFor="q-num" className="text-xs">
							رقم العرض
						</Label>
						<Input
							id="q-num"
							value={value.quoteNumber}
							onChange={(e) => set("quoteNumber", e.target.value)}
							placeholder="Q-2026-0001"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-date" className="text-xs">
							تاريخ الإصدار
						</Label>
						<Input
							id="q-date"
							type="date"
							value={value.issueDate}
							onChange={(e) => set("issueDate", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-valid" className="text-xs">
							ساري حتى
						</Label>
						<Input
							id="q-valid"
							type="date"
							value={value.validUntil}
							onChange={(e) => set("validUntil", e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div>
				<h4 className="mb-3 text-sm font-semibold">معلومات المشروع</h4>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="q-proj-name" className="text-xs">
							اسم المشروع
						</Label>
						<Input
							id="q-proj-name"
							value={value.projectName}
							onChange={(e) => set("projectName", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="q-proj-addr" className="text-xs">
							موقع المشروع
						</Label>
						<Input
							id="q-proj-addr"
							value={value.projectAddress}
							onChange={(e) => set("projectAddress", e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3">
				<Checkbox
					id="q-vat"
					checked={value.includeVAT}
					onCheckedChange={(v) => set("includeVAT", Boolean(v))}
				/>
				<Label htmlFor="q-vat" className="text-sm">
					شمل ضريبة القيمة المضافة (15%)
				</Label>
			</div>
		</div>
	);
}
