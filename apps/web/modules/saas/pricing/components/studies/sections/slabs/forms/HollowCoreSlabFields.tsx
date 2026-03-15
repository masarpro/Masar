"use client";

import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Calculator,
	LayoutGrid,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../../../../lib/utils";
import { COMMON_THICKNESSES } from "../../../../../constants/slabs";
import {
	DimensionsCard,
	CalculationResultsPanel,
} from "../../../shared";
import type { SlabTypeFieldsProps } from "../types";

export function HollowCoreSlabFields({
	formData,
	setFormData,
	calculations,
	showCuttingDetails,
	setShowCuttingDetails,
	showFormwork,
	setShowFormwork,
}: SlabTypeFieldsProps) {
	const t = useTranslations();

	return (
		<>
			{/* الأبعاد - للهولوكور */}
			<DimensionsCard
				title="أبعاد السقف"
				dimensions={[
					{
						key: "length",
						label: "الطول",
						value: formData.length,
						unit: "م",
						step: 0.1,
					},
					{
						key: "width",
						label: "العرض",
						value: formData.width,
						unit: "م",
						step: 0.1,
					},
				]}
				onDimensionChange={(key, value) =>
					setFormData({ ...formData, [key]: value })
				}
				calculatedArea={formData.length * formData.width}
			/>

			{/* إعدادات الهولوكور */}
			<div className="border rounded-lg p-4 bg-green-50/30">
				<h5 className="font-medium mb-3 flex items-center gap-2">
					<LayoutGrid className="h-4 w-4 text-green-600" />
					إعدادات سقف الهولوكور
				</h5>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="space-y-1.5">
						<Label className="text-sm">عرض اللوح (م)</Label>
						<Select
							value={formData.panelWidth.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									panelWidth: +v,
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[0.6, 1.0, 1.2].map((w) => (
									<SelectItem key={w} value={w.toString()}>
										{w} م
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm">سماكة اللوح (سم)</Label>
						<Select
							value={formData.panelThickness.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									panelThickness: +v,
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{COMMON_THICKNESSES.hollow_core.map((t) => (
									<SelectItem key={t} value={t.toString()}>
										{t} سم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm">
							سماكة الطبقة العلوية (سم)
						</Label>
						<Select
							value={formData.toppingThickness.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									toppingThickness: +v,
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{COMMON_THICKNESSES.topping.map((t) => (
									<SelectItem key={t} value={t.toString()}>
										{t} سم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="bg-green-100/50 rounded-lg p-3 flex flex-col justify-center items-center">
						<span className="text-xs text-muted-foreground">
							عدد الألواح
						</span>
						<span className="font-bold text-lg text-green-700">
							{Math.ceil(formData.width / formData.panelWidth)}{" "}
							لوح
						</span>
					</div>
				</div>
			</div>

			{/* نتائج الحساب */}
			{calculations && (
				<div className="bg-muted/50 rounded-lg p-4 space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<Calculator className="h-5 w-5 text-primary" />
						<h4 className="font-medium">
							{t("pricing.studies.calculations.results")}
						</h4>
					</div>

					{/* تفاصيل تكلفة الألواح */}
					{calculations.panelsCostBreakdown && (
						<div className="bg-green-100/50 rounded p-3 space-y-1">
							<div className="flex items-center gap-2 text-green-700 font-medium">
								<LayoutGrid className="h-4 w-4" />
								تفاصيل تكلفة الألواح
							</div>
							<div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
								<span>سعر اللوح / م²: {formatNumber(calculations.panelsCostBreakdown.panelPricePerSqm)} ريال</span>
								<span>تكلفة الخرسانة العلوية: {formatNumber(calculations.panelsCostBreakdown.concreteCost)} ريال</span>
								<span>إجمالي الألواح: {formatNumber(calculations.panelsCostBreakdown.panelsCost)} ريال</span>
							</div>
						</div>
					)}

					{/* البلوكات - للهوردي */}
					{calculations.blocksCount &&
						calculations.blocksCount > 0 && (
							<div className="bg-orange-100/50 rounded p-3">
								<div className="flex items-center gap-2 text-orange-700">
									<LayoutGrid className="h-4 w-4" />
									<span className="font-medium">
										عدد البلوكات:{" "}
										{formatNumber(calculations.blocksCount, 0)}{" "}
										بلوكة
									</span>
								</div>
							</div>
						)}

					{/* خيار عرض الشدات */}
					<div className="flex items-center justify-between border rounded-lg p-3 bg-background">
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="showFormwork-hc"
								checked={showFormwork}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setShowFormwork(e.target.checked)}
								className="rounded"
							/>
							<Label
								htmlFor="showFormwork-hc"
								className="text-sm font-medium cursor-pointer"
							>
								إظهار حساب الشدات
							</Label>
						</div>
						{showFormwork && calculations.formworkArea > 0 && (
							<div className="flex items-center gap-2 text-blue-600">
								<LayoutGrid className="h-4 w-4" />
								<span className="font-bold">
									{formatNumber(calculations.formworkArea)}{" "}
									{t("pricing.studies.units.m2")}
								</span>
							</div>
						)}
					</div>

					{/* إجمالي السقف */}
					<CalculationResultsPanel
						concreteVolume={calculations.concreteVolume}
						totals={calculations.totals}
						cuttingDetails={calculations.rebarDetails.map(
							(detail) => ({
								description: detail.description,
								diameter: detail.diameter,
								barLength: detail.barLength,
								barCount: detail.barCount,
								stocksNeeded: detail.stocksNeeded,
								weight: detail.weight,
								grossWeight: detail.grossWeight ?? detail.weight,
								wastePercentage: detail.wastePercentage,
								stockBarsPerUnit: detail.stockBarsPerUnit,
								splicesPerBar: detail.splicesPerBar,
								lapSpliceLength: detail.lapSpliceLength,
							}),
						)}
						showCuttingDetails={showCuttingDetails}
						onToggleCuttingDetails={setShowCuttingDetails}
					/>
				</div>
			)}
		</>
	);
}
