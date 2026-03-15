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
	Package,
	LayoutGrid,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { REBAR_DIAMETERS } from "../../../../../constants/prices";
import {
	COMMON_THICKNESSES,
	HORDI_BLOCK_SIZES,
} from "../../../../../constants/slabs";
import { formatNumber } from "../../../../../lib/utils";
import {
	DimensionsCard,
	RebarMeshInput,
	CalculationResultsPanel,
} from "../../../shared";
import type { SlabTypeFieldsProps } from "../types";

export function RibbedSlabFields({
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
			{/* الأبعاد - للهوردي */}
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

			{/* إعدادات الهوردي */}
			<div className="border rounded-lg p-4 bg-orange-50/30">
				<h5 className="font-medium mb-3 flex items-center gap-2">
					<Package className="h-4 w-4 text-orange-600" />
					إعدادات سقف الهوردي
				</h5>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<div className="space-y-1.5">
						<Label className="text-sm">عرض العصب (سم)</Label>
						<Select
							value={formData.ribWidth.toString()}
							onValueChange={(v: string) =>
								setFormData({ ...formData, ribWidth: +v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 12, 15, 18, 20].map((w) => (
									<SelectItem key={w} value={w.toString()}>
										{w} سم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm">
							محور الأعصاب (سم)
						</Label>
						<Select
							value={formData.ribSpacing.toString()}
							onValueChange={(v: string) =>
								setFormData({ ...formData, ribSpacing: +v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[40, 45, 50, 52, 55, 60, 65].map((s) => (
									<SelectItem key={s} value={s.toString()}>
										{s} سم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm">
							ارتفاع البلوك (سم)
						</Label>
						<Select
							value={formData.blockHeight.toString()}
							onValueChange={(v: string) =>
								setFormData({ ...formData, blockHeight: +v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{HORDI_BLOCK_SIZES.map((b) => (
									<SelectItem
										key={b.nameAr}
										value={b.height.toString()}
									>
										{b.height} سم ({b.nameAr})
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
					<div className="bg-orange-100/50 rounded-lg p-3 flex flex-col justify-center items-center">
						<span className="text-xs text-muted-foreground">
							السماكة الكلية
						</span>
						<span className="font-bold text-lg text-orange-700">
							{formData.blockHeight + formData.toppingThickness}{" "}
							سم
						</span>
					</div>
				</div>
			</div>

			{/* تسليح الهوردي */}
			<div className="border-t pt-4 space-y-4">
				<h4 className="font-medium flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-orange-500" />
					تسليح الأعصاب
				</h4>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="space-y-1.5">
						<Label className="text-sm text-blue-700">
							عدد أسياخ القاع
						</Label>
						<Select
							value={formData.ribBottomBars.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									ribBottomBars: +v,
								})
							}
						>
							<SelectTrigger className="border-blue-200">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[2, 3, 4].map((n) => (
									<SelectItem key={n} value={n.toString()}>
										{n} أسياخ
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm text-blue-700">
							قطر سيخ القاع
						</Label>
						<Select
							value={formData.ribBarDiameter.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									ribBarDiameter: +v,
								})
							}
						>
							<SelectTrigger className="border-blue-200">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{REBAR_DIAMETERS.filter(
									(d) => d >= 10 && d <= 16,
								).map((d) => (
									<SelectItem key={d} value={d.toString()}>
										{d} مم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm text-green-700">
							عدد أسياخ الرأس
						</Label>
						<Select
							value={formData.ribTopBars.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									ribTopBars: +v,
								})
							}
						>
							<SelectTrigger className="border-green-200">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[1, 2, 3].map((n) => (
									<SelectItem key={n} value={n.toString()}>
										{n} أسياخ
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-sm text-green-700">
							قطر سيخ الرأس
						</Label>
						<Select
							value={formData.ribTopBarDiameter.toString()}
							onValueChange={(v: string) =>
								setFormData({
									...formData,
									ribTopBarDiameter: +v,
								})
							}
						>
							<SelectTrigger className="border-green-200">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{REBAR_DIAMETERS.filter(
									(d) => d >= 8 && d <= 12,
								).map((d) => (
									<SelectItem key={d} value={d.toString()}>
										{d} مم
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* كانات العصب */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="hasRibStirrup"
							checked={formData.hasRibStirrup}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>,
							) =>
								setFormData({
									...formData,
									hasRibStirrup: e.target.checked,
								})
							}
							className="rounded border-gray-500"
						/>
						<Label
							htmlFor="hasRibStirrup"
							className="text-sm font-medium cursor-pointer"
						>
							كانات العصب
						</Label>
					</div>
					{formData.hasRibStirrup && (
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-sm">قطر الكانة</Label>
								<Select
									value={formData.ribStirrupDiameter.toString()}
									onValueChange={(v: string) =>
										setFormData({
											...formData,
											ribStirrupDiameter: +v,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{REBAR_DIAMETERS.filter(
											(d) => d >= 6 && d <= 10,
										).map((d) => (
											<SelectItem
												key={d}
												value={d.toString()}
											>
												{d} مم
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label className="text-sm">
									تباعد الكانات (مم)
								</Label>
								<Select
									value={formData.ribStirrupSpacing.toString()}
									onValueChange={(v: string) =>
										setFormData({
											...formData,
											ribStirrupSpacing: +v,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[150, 200, 250, 300].map((s) => (
											<SelectItem
												key={s}
												value={s.toString()}
											>
												{s} مم
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</div>

				{/* تسليح الطبقة العلوية */}
				<div className="space-y-3 border-t pt-3">
					<h5 className="text-sm font-medium text-blue-700">
						تسليح الطبقة العلوية
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<RebarMeshInput
							title="الشبكة العلوية"
							direction="الاتجاه الطويل"
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
								(d) => d >= 6 && d <= 10,
							)}
							availableBarsPerMeter={[4, 5, 6, 7]}
						/>
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

					{/* البلوكات */}
					{calculations.blocksCount &&
						calculations.blocksCount > 0 && (
							<div className="bg-orange-100/50 rounded p-3">
								<div className="flex items-center gap-2 text-orange-700">
									<Package className="h-4 w-4" />
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
								id="showFormwork-ribbed"
								checked={showFormwork}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setShowFormwork(e.target.checked)}
								className="rounded"
							/>
							<Label
								htmlFor="showFormwork-ribbed"
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
