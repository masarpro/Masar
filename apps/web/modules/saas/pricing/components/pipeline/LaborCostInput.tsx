"use client";

import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type LaborCostType = "PER_SQM" | "PER_CBM" | "PER_UNIT" | "PER_LM" | "LUMP_SUM" | "SALARY";

interface LaborCostInputProps {
	laborType: LaborCostType | null;
	laborUnitCost: number | null;
	laborQuantity: number | null;
	laborWorkers: number | null;
	laborSalary: number | null;
	laborMonths: number | null;
	laborTotal: number | null;
	onChange: (data: {
		laborType?: LaborCostType | null;
		laborUnitCost?: number | null;
		laborQuantity?: number | null;
		laborWorkers?: number | null;
		laborSalary?: number | null;
		laborMonths?: number | null;
	}) => void;
}

const LABOR_TYPES: { value: LaborCostType; label: string }[] = [
	{ value: "PER_SQM", label: "بالمتر المربع" },
	{ value: "PER_CBM", label: "بالمتر المكعب" },
	{ value: "PER_UNIT", label: "بالوحدة" },
	{ value: "PER_LM", label: "بالمتر الطولي" },
	{ value: "LUMP_SUM", label: "مقطوعية" },
	{ value: "SALARY", label: "بالراتب" },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function LaborCostInput({
	laborType,
	laborUnitCost,
	laborQuantity,
	laborWorkers,
	laborSalary,
	laborMonths,
	laborTotal,
	onChange,
}: LaborCostInputProps) {
	const t = useTranslations();

	return (
		<div className="space-y-2" dir="rtl">
			{/* Type selector */}
			<Select
				value={laborType || "none"}
				onValueChange={(v: any) =>
					onChange({ laborType: v === "none" ? null : (v as LaborCostType) })
				}
			>
				<SelectTrigger className="h-8 text-xs">
					<SelectValue placeholder={t("pricing.pipeline.costingLaborType")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">— بدون —</SelectItem>
					{LABOR_TYPES.map((lt) => (
						<SelectItem key={lt.value} value={lt.value}>
							{lt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Per-unit types */}
			{laborType && ["PER_SQM", "PER_CBM", "PER_UNIT", "PER_LM"].includes(laborType) && (
				<div className="flex items-center gap-2">
					<Input
						type="number"
						placeholder="السعر"
						value={laborUnitCost ?? ""}
						onChange={(e: any) =>
							onChange({ laborUnitCost: e.target.value ? Number(e.target.value) : null })
						}
						className="h-7 text-xs w-20"
						dir="ltr"
					/>
					<span className="text-[10px] text-muted-foreground">×</span>
					<Input
						type="number"
						placeholder="الكمية"
						value={laborQuantity ?? ""}
						onChange={(e: any) =>
							onChange({ laborQuantity: e.target.value ? Number(e.target.value) : null })
						}
						className="h-7 text-xs w-20"
						dir="ltr"
					/>
				</div>
			)}

			{/* Lump sum */}
			{laborType === "LUMP_SUM" && (
				<Input
					type="number"
					placeholder="المبلغ المقطوع"
					value={laborUnitCost ?? ""}
					onChange={(e: any) =>
						onChange({ laborUnitCost: e.target.value ? Number(e.target.value) : null })
					}
					className="h-7 text-xs"
					dir="ltr"
				/>
			)}

			{/* Salary */}
			{laborType === "SALARY" && (
				<div className="grid grid-cols-3 gap-1.5">
					<Input
						type="number"
						placeholder="عمال"
						value={laborWorkers ?? ""}
						onChange={(e: any) =>
							onChange({ laborWorkers: e.target.value ? Number(e.target.value) : null })
						}
						className="h-7 text-xs"
						dir="ltr"
					/>
					<Input
						type="number"
						placeholder="راتب"
						value={laborSalary ?? ""}
						onChange={(e: any) =>
							onChange({ laborSalary: e.target.value ? Number(e.target.value) : null })
						}
						className="h-7 text-xs"
						dir="ltr"
					/>
					<Input
						type="number"
						placeholder="أشهر"
						value={laborMonths ?? ""}
						onChange={(e: any) =>
							onChange({ laborMonths: e.target.value ? Number(e.target.value) : null })
						}
						className="h-7 text-xs"
						dir="ltr"
					/>
				</div>
			)}

			{/* Total display */}
			{laborType && laborTotal != null && laborTotal > 0 && (
				<div className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">
					= {laborTotal.toLocaleString("en-SA", { minimumFractionDigits: 2 })} ر.س
				</div>
			)}
		</div>
	);
}
