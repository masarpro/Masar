"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2 } from "lucide-react";

export interface DisplayConfig {
	grouping: "BY_SECTION" | "BY_FLOOR" | "BY_ITEM" | "FLAT";
	showItemNumber: boolean;
	showDescription: boolean;
	showSpecifications: boolean;
	showQuantity: boolean;
	showUnit: boolean;
	showUnitPrice: boolean;
	showItemTotal: boolean;
	showStructural: boolean;
	showFinishing: boolean;
	showMEP: boolean;
	showManualItems: boolean;
	showMaterialDetails: boolean;
	showSectionSubtotal: boolean;
	showSubtotal: boolean;
	showDiscount: boolean;
	showVAT: boolean;
	showGrandTotal: boolean;
	showPricePerSqm: boolean;
}

interface QuotationCustomizerProps {
	config: DisplayConfig;
	onChange: (config: DisplayConfig) => void;
	studyId: string;
	organizationId: string;
	onBack: () => void;
	onNext: () => void;
}

const GROUPING_OPTIONS = [
	{ value: "BY_SECTION" as const, label: "بحسب القسم" },
	{ value: "BY_FLOOR" as const, label: "بحسب الدور" },
	{ value: "BY_ITEM" as const, label: "بحسب البند" },
	{ value: "FLAT" as const, label: "بدون تجميع" },
];

export function QuotationCustomizer({
	config,
	onChange,
	studyId,
	organizationId,
	onBack,
	onNext,
}: QuotationCustomizerProps) {
	// Fetch sample costing items for preview
	const { data: costingItems, isLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const toggle = (key: keyof DisplayConfig) => {
		onChange({ ...config, [key]: !config[key] });
	};

	const setGrouping = (g: DisplayConfig["grouping"]) => {
		onChange({ ...config, grouping: g });
	};

	const fmt = (n: number) =>
		Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

	const sampleItems = ((costingItems as any) ?? []).slice(0, 5);

	return (
		<div className="rounded-xl border border-border bg-card p-5 space-y-5">
			<h3 className="font-semibold text-base">تخصيص عرض السعر</h3>

			{/* Columns */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">الأعمدة</Label>
				<div className="flex flex-wrap gap-2">
					{([
						["showItemNumber", "رقم البند"],
						["showDescription", "الوصف"],
						["showSpecifications", "المواصفات"],
						["showQuantity", "الكمية"],
						["showUnit", "الوحدة"],
						["showUnitPrice", "سعر الوحدة"],
						["showItemTotal", "الإجمالي"],
					] as const).map(([key, label]) => (
						<CheckboxPill
							key={key}
							checked={config[key]}
							onChange={() => toggle(key)}
							label={label}
						/>
					))}
				</div>
			</div>

			{/* Sections */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">الأقسام</Label>
				<div className="flex flex-wrap gap-2">
					{([
						["showStructural", "الأعمال الإنشائية"],
						["showFinishing", "أعمال التشطيبات"],
						["showMEP", "الأعمال الكهروميكانيكية"],
						["showManualItems", "البنود اليدوية"],
						["showMaterialDetails", "تفاصيل المواد"],
					] as const).map(([key, label]) => (
						<CheckboxPill
							key={key}
							checked={config[key]}
							onChange={() => toggle(key)}
							label={label}
						/>
					))}
				</div>
			</div>

			{/* Grouping */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">التجميع</Label>
				<div className="flex gap-2 flex-wrap">
					{GROUPING_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setGrouping(opt.value)}
							className={cn(
								"px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
								config.grouping === opt.value
									? "border-primary bg-primary/5 text-primary"
									: "border-border hover:border-muted-foreground/30",
							)}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* Totals */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">المجاميع</Label>
				<div className="flex flex-wrap gap-2">
					{([
						["showSectionSubtotal", "المجموع الفرعي لكل قسم"],
						["showSubtotal", "الإجمالي قبل الضريبة"],
						["showVAT", "ضريبة القيمة المضافة"],
						["showGrandTotal", "الإجمالي النهائي"],
						["showDiscount", "الخصم"],
						["showPricePerSqm", "تكلفة المتر المربع"],
					] as const).map(([key, label]) => (
						<CheckboxPill
							key={key}
							checked={config[key]}
							onChange={() => toggle(key)}
							label={label}
						/>
					))}
				</div>
			</div>

			{/* Mini preview */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">معاينة فورية</Label>
				<div className="rounded-lg border border-border overflow-hidden">
					{isLoading ? (
						<div className="flex justify-center py-6">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead>
									<tr className="border-b bg-muted/30 text-muted-foreground">
										{config.showItemNumber && <th className="px-2 py-2 text-right font-medium">#</th>}
										{config.showDescription && <th className="px-2 py-2 text-right font-medium">الوصف</th>}
										{config.showSpecifications && <th className="px-2 py-2 text-center font-medium">المواصفات</th>}
										{config.showQuantity && <th className="px-2 py-2 text-center font-medium">الكمية</th>}
										{config.showUnit && <th className="px-2 py-2 text-center font-medium">الوحدة</th>}
										{config.showUnitPrice && <th className="px-2 py-2 text-center font-medium">سعر الوحدة</th>}
										{config.showItemTotal && <th className="px-2 py-2 text-center font-medium">الإجمالي</th>}
									</tr>
								</thead>
								<tbody>
									{sampleItems.map((item: any, idx: number) => (
										<tr key={item.id} className="border-b last:border-0">
											{config.showItemNumber && <td className="px-2 py-1.5">{idx + 1}</td>}
											{config.showDescription && <td className="px-2 py-1.5">{item.description}</td>}
											{config.showSpecifications && <td className="px-2 py-1.5 text-center text-muted-foreground">—</td>}
											{config.showQuantity && <td className="px-2 py-1.5 text-center" dir="ltr">{fmt(Number(item.quantity))}</td>}
											{config.showUnit && <td className="px-2 py-1.5 text-center">{item.unit}</td>}
											{config.showUnitPrice && <td className="px-2 py-1.5 text-center" dir="ltr">{fmt(Number(item.totalCost) / Number(item.quantity || 1))}</td>}
											{config.showItemTotal && <td className="px-2 py-1.5 text-center font-medium" dir="ltr">{fmt(Number(item.totalCost))}</td>}
										</tr>
									))}
									{sampleItems.length === 0 && (
										<tr>
											<td colSpan={7} className="text-center py-4 text-muted-foreground">
												لا توجد بنود
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-between">
				<Button variant="outline" onClick={onBack} className="rounded-xl">
					← رجوع
				</Button>
				<Button onClick={onNext} className="rounded-xl">
					بيانات العرض →
				</Button>
			</div>
		</div>
	);
}

function CheckboxPill({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onChange}
			className={cn(
				"px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5",
				checked
					? "border-primary bg-primary/5 text-primary"
					: "border-border text-muted-foreground hover:border-muted-foreground/30",
			)}
		>
			<span className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px]",
				checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
			)}>
				{checked && "✓"}
			</span>
			{label}
		</button>
	);
}
