"use client";

import { cn } from "@ui/lib";
import { FileSpreadsheet, Ruler, Wallet, Settings2 } from "lucide-react";

export type QuotationFormatType = "DETAILED_BOQ" | "PER_SQM" | "LUMP_SUM" | "CUSTOM";

interface QuotationFormatSelectorProps {
	value: QuotationFormatType;
	onChange: (format: QuotationFormatType) => void;
}

const FORMATS: Array<{
	value: QuotationFormatType;
	label: string;
	description: string;
	icon: typeof FileSpreadsheet;
}> = [
	{
		value: "DETAILED_BOQ",
		label: "تفصيلي (BOQ)",
		description: "كل بند بالتفصيل — كميات ومواصفات وأسعار",
		icon: FileSpreadsheet,
	},
	{
		value: "PER_SQM",
		label: "بالمتر المربع",
		description: "سعر إجمالي للمتر المربع مع المواصفات",
		icon: Ruler,
	},
	{
		value: "LUMP_SUM",
		label: "مقطوعية",
		description: "مبلغ إجمالي فقط مع المواصفات",
		icon: Wallet,
	},
	{
		value: "CUSTOM",
		label: "مخصص",
		description: "تحكم كامل في الأعمدة والصفوف المعروضة",
		icon: Settings2,
	},
];

export function QuotationFormatSelector({
	value,
	onChange,
}: QuotationFormatSelectorProps) {
	return (
		<div className="space-y-3">
			<h3 className="font-semibold text-base">كيف تريد عرض السعر للعميل؟</h3>
			<div className="grid grid-cols-2 gap-3">
				{FORMATS.map((fmt) => {
					const Icon = fmt.icon;
					const isSelected = value === fmt.value;
					return (
						<button
							key={fmt.value}
							type="button"
							onClick={() => onChange(fmt.value)}
							className={cn(
								"flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all hover:shadow-sm",
								isSelected
									? "border-primary bg-primary/5 shadow-sm"
									: "border-border hover:border-muted-foreground/30",
							)}
						>
							<div
								className={cn(
									"p-3 rounded-xl",
									isSelected ? "bg-primary/10" : "bg-muted",
								)}
							>
								<Icon
									className={cn(
										"h-6 w-6",
										isSelected ? "text-primary" : "text-muted-foreground",
									)}
								/>
							</div>
							<div>
								<p className="font-medium text-sm">{fmt.label}</p>
								<p className="text-xs text-muted-foreground mt-1">
									{fmt.description}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
