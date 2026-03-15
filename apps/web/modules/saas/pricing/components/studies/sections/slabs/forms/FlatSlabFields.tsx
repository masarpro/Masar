"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import {
	Calculator,
	LayoutGrid,
	AlertTriangle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { REBAR_DIAMETERS } from "../../../../../constants/prices";
import { formatNumber } from "../../../../../lib/utils";
import {
	DimensionsCard,
	RebarMeshInput,
	CalculationResultsPanel,
} from "../../../shared";
import type { SlabTypeFieldsProps } from "../types";

export function FlatSlabFields({
	formData,
	setFormData,
	calculations,
	showCuttingDetails,
	setShowCuttingDetails,
	showFormwork,
	setShowFormwork,
	mainDirection,
	secondaryDirection,
	mainLabel,
	secondaryLabel,
}: SlabTypeFieldsProps) {
	const t = useTranslations();

	return (
		<>
			{/* الأبعاد */}
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
					{
						key: "thickness",
						label: "السماكة",
						value: formData.thickness,
						unit: "سم",
						step: 1,
					},
				]}
				onDimensionChange={(key, value) =>
					setFormData({ ...formData, [key]: value })
				}
				calculatedArea={formData.length * formData.width}
			/>

			{/* إعدادات الفلات سلاب */}
			<div className="border rounded-lg p-4 bg-purple-50/30">
				<div className="flex items-center gap-2 mb-3">
					<input
						type="checkbox"
						id="hasDropPanels"
						checked={formData.hasDropPanels}
						onChange={(
							e: React.ChangeEvent<HTMLInputElement>,
						) =>
							setFormData({
								...formData,
								hasDropPanels: e.target.checked,
							})
						}
						className="rounded border-purple-500"
					/>
					<Label
						htmlFor="hasDropPanels"
						className="text-sm font-medium text-purple-700 cursor-pointer"
					>
						يوجد تكثيف (Drop Panels)
					</Label>
				</div>
				{formData.hasDropPanels && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="space-y-1.5">
							<Label className="text-sm">طول التكثيف (م)</Label>
							<Input
								type="number"
								step="0.1"
								value={formData.dropPanelLength}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) =>
									setFormData({
										...formData,
										dropPanelLength: +e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-sm">
								عرض التكثيف (م)
							</Label>
							<Input
								type="number"
								step="0.1"
								value={formData.dropPanelWidth}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) =>
									setFormData({
										...formData,
										dropPanelWidth: +e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-sm">
								عمق إضافي (م)
							</Label>
							<Input
								type="number"
								step="0.05"
								value={formData.dropPanelDepth}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) =>
									setFormData({
										...formData,
										dropPanelDepth: +e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-sm">عدد التكثيفات</Label>
							<Input
								type="number"
								min={1}
								value={formData.dropPanelCount}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) =>
									setFormData({
										...formData,
										dropPanelCount: +e.target.value,
									})
								}
							/>
						</div>
					</div>
				)}
			</div>

			{/* تحذيرات الفلات سلاب */}
			<div className="space-y-2">
				{/* تحذير السماكة الدنيا */}
				{(() => {
					const longerSpan = Math.max(formData.length, formData.width);
					const minThickness = formData.hasDropPanels
						? (longerSpan * 1000) / 36
						: (longerSpan * 1000) / 33;
					return formData.thickness < minThickness && formData.length > 0 && formData.width > 0 ? (
						<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
							{t("structural.flatSlab.minThicknessWarning", {
								entered: formData.thickness,
								minimum: Math.ceil(minThickness / 10),
							})}
						</div>
					) : null;
				})()}

				{/* تحذير عدم وجود شبكة علوية */}
				{!formData.hasTopMesh && (
					<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
						{t("structural.flatSlab.noTopMeshWarning")}
					</div>
				)}

				{/* توصية بالتكثيفات للأبحر الكبيرة */}
				{!formData.hasDropPanels && Math.max(formData.length, formData.width) > 6 && (
					<div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm">
						{t("structural.flatSlab.dropPanelRecommendation")}
					</div>
				)}
			</div>

			{/* تسليح السقف */}
			<div className="border-t pt-4 space-y-4">
				<h4 className="font-medium flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-primary" />
					تسليح السقف
				</h4>

				{/* الشبكة السفلية */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-blue-700">
						الشبكة السفلية (الفرش)
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<RebarMeshInput
							title={mainLabel}
							direction={mainDirection}
							diameter={formData.bottomMainDiameter}
							onDiameterChange={(d) =>
								setFormData({
									...formData,
									bottomMainDiameter: d,
								})
							}
							barsPerMeter={formData.bottomMainBarsPerMeter}
							onBarsPerMeterChange={(n) =>
								setFormData({
									...formData,
									bottomMainBarsPerMeter: n,
								})
							}
							colorScheme="blue"
							availableDiameters={REBAR_DIAMETERS.filter(
								(d) => d >= 10 && d <= 16,
							)}
							availableBarsPerMeter={[5, 6, 7, 8, 9, 10]}
						/>
						<RebarMeshInput
							title={secondaryLabel}
							direction={secondaryDirection}
							diameter={formData.bottomSecondaryDiameter}
							onDiameterChange={(d) =>
								setFormData({
									...formData,
									bottomSecondaryDiameter: d,
								})
							}
							barsPerMeter={
								formData.bottomSecondaryBarsPerMeter
							}
							onBarsPerMeterChange={(n) =>
								setFormData({
									...formData,
									bottomSecondaryBarsPerMeter: n,
								})
							}
							colorScheme="blue"
							availableDiameters={REBAR_DIAMETERS.filter(
								(d) => d >= 8 && d <= 14,
							)}
							availableBarsPerMeter={[4, 5, 6, 7, 8]}
						/>
					</div>
				</div>

				{/* الشبكة العلوية */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="hasTopMesh-flat"
							checked={formData.hasTopMesh}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>,
							) =>
								setFormData({
									...formData,
									hasTopMesh: e.target.checked,
								})
							}
							className="rounded border-green-500"
						/>
						<Label
							htmlFor="hasTopMesh-flat"
							className="text-sm font-medium text-green-700 cursor-pointer"
						>
							الشبكة العلوية (الغطاء) - للسحب السالب
						</Label>
					</div>
					{formData.hasTopMesh && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<RebarMeshInput
								title={mainLabel}
								direction={mainDirection}
								diameter={formData.topMainDiameter}
								onDiameterChange={(d) =>
									setFormData({
										...formData,
										topMainDiameter: d,
									})
								}
								barsPerMeter={formData.topMainBarsPerMeter}
								onBarsPerMeterChange={(n) =>
									setFormData({
										...formData,
										topMainBarsPerMeter: n,
									})
								}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter(
									(d) => d >= 8 && d <= 14,
								)}
								availableBarsPerMeter={[4, 5, 6, 7, 8]}
							/>
							<RebarMeshInput
								title={secondaryLabel}
								direction={secondaryDirection}
								diameter={formData.topSecondaryDiameter}
								onDiameterChange={(d) =>
									setFormData({
										...formData,
										topSecondaryDiameter: d,
									})
								}
								barsPerMeter={
									formData.topSecondaryBarsPerMeter
								}
								onBarsPerMeterChange={(n) =>
									setFormData({
										...formData,
										topSecondaryBarsPerMeter: n,
									})
								}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter(
									(d) => d >= 8 && d <= 12,
								)}
								availableBarsPerMeter={[3, 4, 5, 6]}
							/>
						</div>
					)}
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

					{/* نوع السقف الإنشائي */}
					{calculations.structuralType && (
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="outline" className={
								calculations.structuralType === 'ONE_WAY'
									? 'border-amber-500 text-amber-700'
									: 'border-blue-500 text-blue-700'
							}>
								{calculations.structuralType === 'ONE_WAY'
									? t('pricing.studies.structural.oneWaySlab')
									: t('pricing.studies.structural.twoWaySlab')}
								{` (${t('pricing.studies.structural.aspectRatio')}: ${calculations.aspectRatio})`}
							</Badge>
						</div>
					)}

					{/* تحذير اتجاه الحديد */}
					{calculations.structuralType === 'ONE_WAY' &&
					 formData.bottomMainDiameter < formData.bottomSecondaryDiameter && (
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
							<p className="text-xs text-amber-700">
								{t('pricing.studies.structural.rebarDirectionWarning')}
							</p>
						</div>
					)}

					{/* خيار عرض الشدات */}
					<div className="flex items-center justify-between border rounded-lg p-3 bg-background">
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="showFormwork-flat"
								checked={showFormwork}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setShowFormwork(e.target.checked)}
								className="rounded"
							/>
							<Label
								htmlFor="showFormwork-flat"
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

					{/* شارة حساب فعلي/تقديري */}
					<div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
						calculations.rebarDetails[0]?.diameter > 0
							? "bg-green-50 text-green-700 border border-green-200"
							: "bg-amber-50 text-amber-700 border border-amber-200"
					}`}>
						{calculations.rebarDetails[0]?.diameter > 0
							? t("structural.flatSlab.actualCalculation")
							: t("structural.flatSlab.estimatedCalculation")}
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
