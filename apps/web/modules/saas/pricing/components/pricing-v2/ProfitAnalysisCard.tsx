"use client";

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

	return (
		<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
			<h4 className="font-semibold">تحليل الأرباح</h4>

			<div className="space-y-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">إجمالي التكلفة</span>
					<span dir="ltr">{fmt(data.totalCost)} ر.س</span>
				</div>
				{data.overheadAmount > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">مصاريف عامة</span>
						<span dir="ltr">{fmt(data.overheadAmount)} ر.س</span>
					</div>
				)}
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">
						هامش الربح ({fmt(data.profitPercent)}%)
					</span>
					<span dir="ltr">{fmt(data.profitAmount)} ر.س</span>
				</div>
				{data.contingencyAmount > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">احتياطي</span>
						<span dir="ltr">{fmt(data.contingencyAmount)} ر.س</span>
					</div>
				)}
				<div className="border-t border-primary/20 pt-2">
					<div className="flex items-center justify-between">
						<span className="font-medium">سعر البيع (قبل الضريبة)</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.sellingPriceBeforeVat)} ر.س
						</span>
					</div>
				</div>
				{data.vatAmount > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
						<span dir="ltr">{fmt(data.vatAmount)} ر.س</span>
					</div>
				)}
				<div className="border-t border-primary/20 pt-2">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-base">الإجمالي النهائي</span>
						<span className="text-xl font-bold text-primary" dir="ltr">
							{fmt(data.grandTotal)} ر.س
						</span>
					</div>
				</div>
			</div>

			{/* Per sqm breakdown */}
			{data.buildingArea > 0 && (
				<div className="rounded-lg border border-primary/20 bg-background/50 p-3 space-y-1.5">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">تكلفة المتر المربع</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.costPerSqm)} ر.س/م²
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">سعر بيع المتر</span>
						<span className="font-medium" dir="ltr">
							{fmt(data.pricePerSqm)} ر.س/م²
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">صافي الربح/م²</span>
						<span className="font-medium text-emerald-600" dir="ltr">
							{fmt(data.pricePerSqm - data.costPerSqm)} ر.س/م²
						</span>
					</div>
				</div>
			)}

			{/* Lump sum analysis */}
			{data.lumpSumAnalysis && (
				<div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1.5">
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
