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
import { useTranslations } from "next-intl";
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
	stockBarsPerUnit?: number;
	splicesPerBar?: number;
	lapSpliceLength?: number;
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
			labelKey: "efficiencyExcellent",
			color: "bg-success",
			textColor: "text-success",
			bgColor: "bg-success/10",
			borderColor: "border-success/30",
			icon: CheckCircle2,
		};
	}
	if (wastePercentage <= 10) {
		return {
			labelKey: "efficiencyGood",
			color: "bg-chart-1",
			textColor: "text-chart-1",
			bgColor: "bg-chart-1/10",
			borderColor: "border-chart-1/30",
			icon: AlertTriangle,
		};
	}
	return {
		labelKey: "efficiencyHigh",
		color: "bg-destructive",
		textColor: "text-destructive",
		bgColor: "bg-destructive/10",
		borderColor: "border-destructive/30",
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
	const t = useTranslations("pricing.studies.resultsPanel");
	const tCalc = useTranslations("pricing.studies.calculations");
	const efficiency = getCuttingEfficiency(totals.wastePercentage);
	const EfficiencyIcon = efficiency.icon;
	const efficiencyLabel = t(efficiency.labelKey as Parameters<typeof t>[0]);
	const tons = totals.grossWeight / 1000;

	return (
		<div className={`space-y-4 ${className || ""}`}>
			{/* القسم الأول: ملخص النتائج الرئيسية */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{/* حجم الخرسانة */}
				<div className="rounded-xl p-4 border-2 bg-card">
					<div className="flex items-center gap-2 mb-2">
						<div className="flex size-8 items-center justify-center bg-chart-4/15 rounded-lg">
							<Box className="h-4 w-4 text-chart-4" />
						</div>
						<span className="text-sm font-medium text-chart-4">
							{tCalc("concreteVolume")}
						</span>
					</div>
					<p className="text-2xl font-bold text-chart-4">
						{formatNumber(concreteVolume)}
						<span className="text-sm font-normal ms-1">م³</span>
					</p>
				</div>

				{/* وزن الحديد */}
				<div className="rounded-xl p-4 border-2 bg-card">
					<div className="flex items-center gap-2 mb-2">
						<div className="flex size-8 items-center justify-center bg-destructive/15 rounded-lg">
							<Scale className="h-4 w-4 text-destructive" />
						</div>
						<span className="text-sm font-medium text-destructive">
							{tCalc("rebarWeight")}
						</span>
					</div>
					<p className="text-2xl font-bold text-destructive">
						{formatNumber(totals.grossWeight)}
						<span className="text-sm font-normal ms-1">كجم</span>
					</p>
					<p className="text-xs text-destructive mt-1">
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
							{t("cuttingEfficiency")}
						</span>
					</div>
					<p className={`text-2xl font-bold ${efficiency.textColor}`}>
						{totals.wastePercentage.toFixed(1)}%
						<span className="text-sm font-normal ms-1">{t("wasteSuffix")}</span>
					</p>
					<p className={`text-xs ${efficiency.textColor} mt-1`}>
						{efficiencyLabel}
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
							<span className="font-medium">{t("cuttingDetailsTitle")}</span>
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
								<TrendingDown className="h-3 w-3 text-success" />
								<span className="text-xs text-muted-foreground">{t("netWeight")}</span>
							</div>
							<p className="text-lg font-bold text-success">
								{formatNumber(totals.netWeight)}
							</p>
							<p className="text-xs text-muted-foreground">كجم</p>
						</div>
						<div className="bg-background rounded-lg p-3 text-center border">
							<div className="flex items-center justify-center gap-1 mb-1">
								<TrendingUp className="h-3 w-3 text-chart-4" />
								<span className="text-xs text-muted-foreground">{t("grossWeight")}</span>
							</div>
							<p className="text-lg font-bold text-chart-4">
								{formatNumber(totals.grossWeight)}
							</p>
							<p className="text-xs text-muted-foreground">كجم</p>
						</div>
						<div className="bg-background rounded-lg p-3 text-center border">
							<div className="flex items-center justify-center gap-1 mb-1">
								<div className={`w-2 h-2 rounded-full ${efficiency.color}`} />
								<span className="text-xs text-muted-foreground">{t("waste")}</span>
							</div>
							<p className={`text-lg font-bold ${efficiency.textColor}`}>
								{totals.wastePercentage.toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground">{efficiencyLabel}</p>
						</div>
					</div>

					{/* جدول تفاصيل القص */}
					{cuttingDetails.length > 0 && (
						<div className="border-2 rounded-lg overflow-hidden">
							<div className="bg-muted/50 px-3 py-2 border-b">
								<h6 className="font-medium text-sm flex items-center gap-2">
									<Scissors className="h-4 w-4" />
									{t("steelDetailsTable")}
								</h6>
							</div>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/30">
											<TableHead className="text-start text-xs font-semibold whitespace-nowrap">
												{t("description")}
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("diameter")}
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("barLength")}
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("count")}
											</TableHead>
											{showCutsPerStock && (
												<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
													{t("cutsPerStock")}
												</TableHead>
											)}
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("bars")}
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("weight")}
											</TableHead>
											<TableHead className="text-center text-xs font-semibold whitespace-nowrap">
												{t("waste")}
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
														<span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
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
														{detail.stockBarsPerUnit && detail.stockBarsPerUnit > 1 && (
															<span className="text-chart-1 text-[10px] block">
																{t("perBar", { count: detail.stockBarsPerUnit })}
															</span>
														)}
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

					{/* تنبيه الوصلات */}
					{cuttingDetails.some(d => d.splicesPerBar && d.splicesPerBar > 0) && (
						<div className="bg-chart-1/10 border border-chart-1/30 rounded-lg p-3 mt-2 mb-2">
							<p className="text-xs text-chart-1 flex items-center gap-1">
								<AlertTriangle className="h-3 w-3 flex-shrink-0" />
								{t("spliceNotice")}
							</p>
						</div>
					)}

					{/* الأسياخ المطلوبة من المصنع */}
					{totals.stocksNeeded.length > 0 && (
						<div className="rounded-lg p-4 border-2 bg-card">
							<h6 className="font-medium text-sm mb-3 flex items-center gap-2 text-chart-4">
								<Package className="h-4 w-4" />
								{t("stocksFromFactory")}
							</h6>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
								{totals.stocksNeeded.map((stock, idx) => (
									<div
										key={idx}
										className="bg-card rounded-lg p-3 border border-chart-4/30 text-center"
									>
										<p className="text-lg font-bold text-chart-4">
											{stock.count}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("stockBarSpec", { diameter: stock.diameter, length: stock.length })}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* اقتراحات استخدام الفضلات */}
					{waste && waste.length > 0 && (
						<div className="rounded-lg p-4 border-2 bg-card">
							<h6 className="font-medium text-sm mb-3 flex items-center gap-2 text-chart-1">
								<Lightbulb className="h-4 w-4" />
								{t("wasteSuggestions")}
							</h6>
							<div className="space-y-2">
								{waste.map((w, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border"
									>
										<div className="flex items-center gap-2">
											<span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
												{w.diameter} مم
											</span>
											<span className="text-xs">
												{t("wastePieceSpec", { length: w.length.toFixed(2), count: w.count })}
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
