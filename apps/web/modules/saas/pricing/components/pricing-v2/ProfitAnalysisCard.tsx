"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";

interface ProfitAnalysisData {
	totalCost: number;
	overheadAmount: number;
	profitAmount: number;
	contingencyAmount: number;
	sellingPriceBeforeVat: number;
	vatAmount: number;
	grandTotal: number;
	profitPercent: number;
	pricePerSqm: number;
	costPerSqm: number;
	buildingArea: number;
	lumpSumAnalysis?: {
		contractValue: number;
		expectedProfit: number;
		profitFromContract: number;
		safetyMargin: number;
	} | null;
}

interface ProfitAnalysisCardProps {
	data: ProfitAnalysisData;
}

export function ProfitAnalysisCard({ data }: ProfitAnalysisCardProps) {
	const fmt = (n: number) =>
		Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

	const rows: { label: string; value: number; isSeparator?: boolean }[] = [
		{ label: "التكلفة المباشرة", value: data.totalCost },
		...(data.profitAmount > 0
			? [{ label: `هامش الربح (${fmt(data.profitPercent)}%)`, value: data.profitAmount }]
			: []),
		...(data.overheadAmount > 0
			? [{ label: "المصاريف الإدارية", value: data.overheadAmount }]
			: []),
		...(data.contingencyAmount > 0
			? [{ label: "الاحتياط", value: data.contingencyAmount }]
			: []),
		{ label: "المجموع قبل الضريبة", value: data.sellingPriceBeforeVat, isSeparator: true },
		...(data.vatAmount > 0
			? [{ label: "ضريبة القيمة المضافة (15%)", value: data.vatAmount }]
			: []),
	];

	return (
		<div className="rounded-xl border border-border bg-card overflow-hidden">
			<div className="p-4 pb-2">
				<h4 className="font-semibold text-sm">ملخص التسعير النهائي</h4>
			</div>

			<Table>
				<TableHeader>
					<TableRow className="bg-muted/30">
						<TableHead className="text-right font-medium">البيان</TableHead>
						<TableHead className="text-left font-medium w-[180px]">المبلغ</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow
							key={row.label}
							className={row.isSeparator ? "border-t-2 border-primary/20 font-medium" : ""}
						>
							<TableCell className="py-3">{row.label}</TableCell>
							<TableCell className="py-3 text-left" dir="ltr">
								{fmt(row.value)} ر.س
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableFooter>
					<TableRow className="bg-primary text-primary-foreground">
						<TableCell className="py-4 text-base font-bold">
							الإجمالي النهائي
						</TableCell>
						<TableCell className="py-4 text-left text-xl font-bold" dir="ltr">
							{fmt(data.grandTotal)} ر.س
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>

			{/* Per-sqm & profit % below the table */}
			{(data.buildingArea > 0 || data.profitPercent > 0) && (
				<div className="px-4 py-4 border-t border-border bg-muted/20 flex items-center justify-center gap-8 flex-wrap text-sm">
					{data.buildingArea > 0 && (
						<div className="text-center">
							<span className="text-muted-foreground">سعر المتر: </span>
							<span className="font-bold text-primary text-lg" dir="ltr">
								{fmt(data.pricePerSqm)} ر.س/م²
							</span>
						</div>
					)}
					{data.profitPercent > 0 && (
						<div className="text-center">
							<span className="text-muted-foreground">نسبة الربح الفعلية: </span>
							<span className="font-bold text-emerald-600 text-lg" dir="ltr">
								{fmt(data.profitPercent)}%
							</span>
						</div>
					)}
				</div>
			)}

			{/* Lump sum analysis */}
			{data.lumpSumAnalysis && (
				<div className="m-4 mt-0 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1.5">
					<h5 className="text-sm font-medium text-amber-700 dark:text-amber-400">
						تحليل المقطوعية
					</h5>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">قيمة العقد</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.lumpSumAnalysis.contractValue)} ر.س
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">الربح المتوقع</span>
						<span
							className={`font-medium ${data.lumpSumAnalysis.expectedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
							dir="ltr"
						>
							{fmt(data.lumpSumAnalysis.expectedProfit)} ر.س
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">نسبة الربح</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.lumpSumAnalysis.profitFromContract)}%
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">هامش الأمان</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.lumpSumAnalysis.safetyMargin)}%
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
