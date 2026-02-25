"use client";

import {
	Box,
	Scale,
	Scissors,
	TrendingDown,
	TrendingUp,
	Package,
	Lightbulb,
	ChevronDown,
	CheckCircle2,
	AlertTriangle,
	XCircle,
} from "lucide-react";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { Button } from "@ui/components/button";
import { formatNumber } from "../../../lib/utils";

interface CuttingDetail {
	description: string;
	diameter: number;
	barLength: number;
	barCount: number;
	cutsPerStock?: number;
	stocksNeeded: number;
	weight: number;
	grossWeight?: number;
	wastePercentage: number;
}

interface StockNeeded {
	diameter: number;
	length: number;
	count: number;
}

interface WasteSuggestion {
	diameter: number;
	length: number;
	count: number;
	suggestedUse: string;
}

interface CalculationResultsPanelProps {
	concreteVolume: number;
	totals: {
		netWeight: number;
		grossWeight: number;
		wastePercentage: number;
		stocksNeeded: StockNeeded[];
	};
	cuttingDetails: CuttingDetail[];
	waste?: WasteSuggestion[];
	showCuttingDetails: boolean;
	onToggleCuttingDetails: (open: boolean) => void;
	showCutsPerStock?: boolean;
	className?: string;
}

function getCuttingEfficiency(wastePercentage: number) {
	if (wastePercentage <= 5) {
		return {
			label: "ممتاز",
			color: "bg-green-500",
			textColor: "text-green-600",
			bgColor: "bg-green-50 dark:bg-green-950",
			borderColor: "border-green-200 dark:border-green-800",
			icon: CheckCircle2,
		};
	}
	if (wastePercentage <= 10) {
		return {
			label: "جيد",
			color: "bg-yellow-500",
			textColor: "text-yellow-600",
			bgColor: "bg-yellow-50 dark:bg-yellow-950",
			borderColor: "border-yellow-200 dark:border-yellow-800",
			icon: AlertTriangle,
		};
	}
	return {
		label: "مرتفع",
		color: "bg-red-500",
		textColor: "text-red-600",
		bgColor: "bg-red-50 dark:bg-red-950",
		borderColor: "border-red-200 dark:border-red-800",
		icon: XCircle,
	};
}

export function CalculationResultsPanel({
	concreteVolume,
	totals,
	cuttingDetails,
	waste,
	showCuttingDetails,
	onToggleCuttingDetails,
	showCutsPerStock = false,
	className,
}: CalculationResultsPanelProps) {
	const efficiency = getCuttingEfficiency(totals.wastePercentage);
	const EfficiencyIcon = efficiency.icon;
	const tons = totals.grossWeight / 1000;

	return (
		<div className={`space-y-4 ${className || ""}`}>
			{/* القسم الأول: ملخص النتائج الرئيسية */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{/* حجم الخرسانة */}
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
					<div className="flex items-center gap-2 mb-2">
						<div className="p-2 bg-blue-500 rounded-lg">
							<Box className="h-4 w-4 text-white" />
						</div>
						<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
							حجم الخرسانة
						</span>
					</div>
					<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
						{formatNumber(concreteVolume)}
						<span className="text-sm font-normal mr-1">م³</span>
					</p>
				</div>

				{/* وزن الحديد */}
				<div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-xl p-4 border border-red-200 dark:border-red-800">
					<div className="flex items-center gap-2 mb-2">
						<div className="p-2 bg-red-500 rounded-lg">
							<Scale className="h-4 w-4 text-white" />
						</div>
						<span className="text-sm font-medium text-red-700 dark:text-red-300">
							وزن الحديد
						</span>
					</div>
					<p className="text-2xl font-bold text-red-900 dark:text-red-100">
						{formatNumber(totals.grossWeight)}
						<span className="text-sm font-normal mr-1">كجم</span>
					</p>
					<p className="text-xs text-red-600 dark:text-red-400 mt-1">
						({tons.toFixed(3)} طن)
					</p>
				</div>

				{/* نسبة الهالك */}
				<div className={`rounded-xl p-4 border ${efficiency.bgColor} ${efficiency.borderColor}`}>
					<div className="flex items-center gap-2 mb-2">
						<div className={`p-2 ${efficiency.color} rounded-lg`}>
							<EfficiencyIcon className="h-4 w-4 text-white" />
						</div>
						<span className={`text-sm font-medium ${efficiency.textColor}`}>
							كفاءة القص
						</span>
					</div>
					<p className={`text-2xl font-bold ${efficiency.textColor}`}>
						{totals.wastePercentage.toFixed(1)}%
						<span className="text-sm font-normal mr-1">هالك</span>
					</p>
					<p className={`text-xs ${efficiency.textColor} mt-1`}>
						{efficiency.label}
					</p>
				</div>
			</div>

			{/* القسم الثاني: تفاصيل القص */}
			<Collapsible open={showCuttingDetails} onOpenChange={onToggleCuttingDetails}>
				<CollapsibleTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-between bg-muted/30 hover:bg-muted/50"
						size="sm"
					>
						<span className="flex items-center gap-2">
							<Scissors className="h-4 w-4" />
							<span className="font-medium">تفاصيل القص والتوزيع</span>
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform duration-200 ${
								showCuttingDetails ? "rotate-180" : ""
							}`}
						/>
					</Button>
				</CollapsibleTrigger>

				<CollapsibleContent className="mt-4 space-y-4">
					{/* ملخص الأوزان */}
					<div className="grid grid-cols-3 gap-3">
						<div className="bg-background rounded-lg p-3 text-center border">
							<div className="flex items-center justify-center gap-1 mb-1">
								<TrendingDown className="h-3 w-3 text-green-600" />
								<span className="text-xs text-muted-foreground">وزن صافي</span>
							</div>
							<p className="text-lg font-bold text-green-600">
								{formatNumber(totals.netWeight)}
							</p>
							<p className="text-xs text-muted-foreground">كجم</p>
						</div>
						<div className="bg-background rounded-lg p-3 text-center border">
							<div className="flex items-center justify-center gap-1 mb-1">
								<TrendingUp className="h-3 w-3 text-blue-600" />
								<span className="text-xs text-muted-foreground">وزن إجمالي</span>
							</div>
							<p className="text-lg font-bold text-blue-600">
								{formatNumber(totals.grossWeight)}
							</p>
							<p className="text-xs text-muted-foreground">كجم</p>
						</div>
						<div className="bg-background rounded-lg p-3 text-center border">
							<div className="flex items-center justify-center gap-1 mb-1">
								<div className={`w-2 h-2 rounded-full ${efficiency.color}`} />
								<span className="text-xs text-muted-foreground">الهالك</span>
							</div>
							<p className={`text-lg font-bold ${efficiency.textColor}`}>
								{totals.wastePercentage.toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground">{efficiency.label}</p>
						</div>
					</div>

					{/* جدول تفاصيل القص */}
					{cuttingDetails.length > 0 && (
						<div className="border rounded-lg overflow-hidden">
							<div className="bg-muted/50 px-3 py-2 border-b">
								<h6 className="font-medium text-sm flex items-center gap-2">
									<Scissors className="h-4 w-4" />
									جدول تفاصيل الحديد
								</h6>
							</div>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/30">
											<TableHead className="text-right text-xs font-semibold whitespace-nowrap">
												الوصف
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												القطر
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												طول السيخ
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												العدد
											</TableHead>
											{showCutsPerStock && (
												<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
													قص/سيخ
												</TableHead>
											)}
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												الأسياخ
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												الوزن
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												الهالك
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{cuttingDetails.map((detail, idx) => {
											const detailEff = getCuttingEfficiency(detail.wastePercentage);
											return (
												<TableRow key={idx} className="hover:bg-muted/20">
													<TableCell className="text-xs font-medium">
														{detail.description}
													</TableCell>
													<TableCell className="text-center">
														<span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
															{detail.diameter} مم
														</span>
													</TableCell>
													<TableCell className="text-xs text-center">
														{detail.barLength.toFixed(2)} م
													</TableCell>
													<TableCell className="text-xs text-center font-medium">
														{detail.barCount}
													</TableCell>
													{showCutsPerStock && (
														<TableCell className="text-xs text-center">
															{detail.cutsPerStock || "-"}
														</TableCell>
													)}
													<TableCell className="text-xs text-center">
														{detail.stocksNeeded}
													</TableCell>
													<TableCell className="text-xs text-center font-medium">
														{formatNumber(detail.grossWeight || detail.weight)} كجم
													</TableCell>
													<TableCell className="text-center">
														<Badge
															status={
																detail.wastePercentage <= 5
																	? "success"
																	: detail.wastePercentage <= 10
																		? "warning"
																		: "error"
															}
															className="text-xs"
														>
															{detail.wastePercentage.toFixed(1)}%
														</Badge>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					)}

					{/* الأسياخ المطلوبة من المصنع */}
					{totals.stocksNeeded.length > 0 && (
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
							<h6 className="font-medium text-sm mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
								<Package className="h-4 w-4" />
								الأسياخ المطلوبة من المصنع
							</h6>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
								{totals.stocksNeeded.map((stock, idx) => (
									<div
										key={idx}
										className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-900 text-center"
									>
										<p className="text-lg font-bold text-blue-600 dark:text-blue-400">
											{stock.count}
										</p>
										<p className="text-xs text-muted-foreground">
											سيخ {stock.diameter} مم × {stock.length}م
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* اقتراحات استخدام الفضلات */}
					{waste && waste.length > 0 && (
						<div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
							<h6 className="font-medium text-sm mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
								<Lightbulb className="h-4 w-4" />
								اقتراحات استخدام الفضلات
							</h6>
							<div className="space-y-2">
								{waste.map((w, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-yellow-100 dark:border-yellow-900"
									>
										<div className="flex items-center gap-2">
											<span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
												{w.diameter} مم
											</span>
											<span className="text-xs">
												{w.length.toFixed(2)}م × {w.count} قطعة
											</span>
										</div>
										<span className="text-xs text-muted-foreground">
											{w.suggestedUse}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
