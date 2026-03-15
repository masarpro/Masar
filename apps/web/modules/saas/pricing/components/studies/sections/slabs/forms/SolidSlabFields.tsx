"use client";

import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
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
	Plus,
	Calculator,
	LayoutGrid,
	ChevronDown,
	ChevronLeft,
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
import { BeamInputRow } from "../BeamInputRow";
import { getDefaultBeam } from "../types";
import type { SlabTypeFieldsProps } from "../types";

export function SolidSlabFields({
	formData,
	setFormData,
	calculations,
	specs,
	slabBeams,
	setSlabBeams,
	expandedBeamIds,
	setExpandedBeamIds,
	beamsCalcs,
	showCuttingDetails,
	setShowCuttingDetails,
	showFormwork,
	setShowFormwork,
	showBeamCutting,
	setShowBeamCutting,
	combinedTotals,
	mainDirection,
	secondaryDirection,
	mainLabel,
	secondaryLabel,
}: SlabTypeFieldsProps) {
	const t = useTranslations();

	const toggleBeam = (id: string) => {
		setExpandedBeamIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const addBeam = () => {
		const newBeam = getDefaultBeam(slabBeams.length);
		setSlabBeams([...slabBeams, newBeam]);
		setExpandedBeamIds([...expandedBeamIds, newBeam.id]);
	};

	const updateBeam = (id: string, updated: typeof slabBeams[0]) => {
		setSlabBeams((prev) =>
			prev.map((b) => (b.id === id ? updated : b)),
		);
	};

	const removeBeam = (id: string) => {
		setSlabBeams((prev) => prev.filter((b) => b.id !== id));
		setExpandedBeamIds((prev) => prev.filter((x) => x !== id));
	};

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

			{/* تسليح السقف الصلب */}
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
							id="hasTopMesh-solid"
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
							htmlFor="hasTopMesh-solid"
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

			{/* كمرات السقف الصلب */}
			<div className="border-t pt-4 space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium flex items-center gap-2">
						<span className="text-lg">📏</span>
						كمرات السقف الصلب
						{slabBeams.length > 0 && (
							<Badge
								variant="secondary"
								className="text-xs"
							>
								{slabBeams.length} كمرة
							</Badge>
						)}
					</h4>
				</div>

				<p className="text-xs text-muted-foreground">
					أضف الكمرات الحاملة للسقف الصلب — يتم حساب خرسانة
					وحديد الكمرات منفصلاً ثم إضافتها لإجمالي السقف
				</p>

				{/* قائمة الكمرات */}
				{slabBeams.length > 0 && (
					<div className="space-y-2">
						{slabBeams.map((beam, idx) => (
							<BeamInputRow
								key={beam.id}
								beam={beam}
								index={idx}
								isExpanded={expandedBeamIds.includes(
									beam.id,
								)}
								onToggle={() => toggleBeam(beam.id)}
								onChange={(updated) =>
									updateBeam(beam.id, updated)
								}
								onRemove={() => removeBeam(beam.id)}
								concreteType={
									specs?.concreteType || "C30"
								}
							/>
						))}
					</div>
				)}

				{/* زر إضافة كمرة */}
				<Button
					variant="outline"
					className="w-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-2 border-dashed border-indigo-400/40 hover:bg-indigo-500/20 hover:border-indigo-400/60 transition-all"
					onClick={addBeam}
				>
					<Plus className="h-4 w-4 ml-2" />
					<span className="font-semibold">إضافة كمرة</span>
				</Button>

				{/* ملخص الكمرات */}
				{beamsCalcs && beamsCalcs.totalConcrete > 0 && (
					<div className="space-y-3">
						<div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 rounded-lg p-3">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-sm">📏</span>
								<h5 className="font-semibold text-sm">
									إجمالي كمرات السقف
								</h5>
							</div>
							<div className="grid grid-cols-3 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">
										خرسانة:
									</span>
									<span className="font-bold mr-1 text-blue-600">
										{formatNumber(
											beamsCalcs.totalConcrete,
										)}{" "}
										م³
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">
										حديد (إجمالي):
									</span>
									<span className="font-bold mr-1 text-orange-600">
										{formatNumber(
											beamsCalcs.totalGrossWeight,
										)}{" "}
										كجم
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">
										هالك:
									</span>
									<span className="font-bold mr-1 text-red-500">
										{formatNumber(
											beamsCalcs.wastePercentage,
											1,
										)}
										%
									</span>
								</div>
							</div>
						</div>

						{/* تفاصيل القص للكمرات */}
						<div>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1.5 text-xs"
								onClick={() =>
									setShowBeamCutting(!showBeamCutting)
								}
							>
								{showBeamCutting ? (
									<ChevronDown className="h-3 w-3" />
								) : (
									<ChevronLeft className="h-3 w-3" />
								)}
								تفاصيل قص حديد الكمرات
							</Button>

							{showBeamCutting && (
								<div className="border rounded-lg overflow-hidden mt-2">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-right text-xs">
													الوصف
												</TableHead>
												<TableHead className="text-right text-xs">
													∅ القطر
												</TableHead>
												<TableHead className="text-right text-xs">
													طول السيخ
												</TableHead>
												<TableHead className="text-right text-xs">
													العدد
												</TableHead>
												<TableHead className="text-right text-xs">
													أسياخ مطلوبة
												</TableHead>
												<TableHead className="text-right text-xs">
													الهالك
												</TableHead>
												<TableHead className="text-right text-xs">
													الوزن
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{beamsCalcs.allCuttingDetails.map(
												(d, i) => (
													<TableRow key={i}>
														<TableCell className="text-xs">
															{d.description}
														</TableCell>
														<TableCell className="text-xs">
															{d.diameter} مم
														</TableCell>
														<TableCell className="text-xs">
															{d.barLength} م
														</TableCell>
														<TableCell className="text-xs">
															{d.barCount}
														</TableCell>
														<TableCell className="text-xs">
															{d.stocksNeeded} ×{" "}
															{d.stockLength}م
														</TableCell>
														<TableCell className="text-xs">
															{d.wastePercentage}%
														</TableCell>
														<TableCell className="text-xs">
															{formatNumber(d.weight)}{" "}
															كجم
														</TableCell>
													</TableRow>
												),
											)}
										</TableBody>
									</Table>

									{/* الأسياخ المطلوبة من المصنع */}
									<div className="bg-muted/30 p-3 border-t">
										<h6 className="text-xs font-semibold mb-2">
											أسياخ المصنع المطلوبة للكمرات:
										</h6>
										<div className="flex flex-wrap gap-3">
											{beamsCalcs.stocksNeeded.map(
												(s, i) => (
													<Badge
														key={i}
														variant="outline"
														className="text-xs"
													>
														∅{s.diameter}مم: {s.count}{" "}
														سيخ × {s.length}م
													</Badge>
												),
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
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
								id="showFormwork-solid"
								checked={showFormwork}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setShowFormwork(e.target.checked)}
								className="rounded"
							/>
							<Label
								htmlFor="showFormwork-solid"
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

					{/* إجمالي السقف (البلاطة فقط) */}
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

					{/* الإجمالي المجمع (سقف + كمرات) */}
					{combinedTotals &&
						beamsCalcs &&
						beamsCalcs.totalConcrete > 0 && (
							<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
								<h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
									<Calculator className="h-4 w-4 text-primary" />
									الإجمالي الكلي (البلاطة + الكمرات)
								</h5>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground text-xs">
											خرسانة البلاطة:
										</span>
										<p className="font-bold">
											{formatNumber(
												combinedTotals.slabConcrete,
											)}{" "}
											م³
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">
											خرسانة الكمرات:
										</span>
										<p className="font-bold text-indigo-600">
											{formatNumber(
												combinedTotals.beamConcrete,
											)}{" "}
											م³
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">
											حديد البلاطة:
										</span>
										<p className="font-bold">
											{formatNumber(
												combinedTotals.slabSteel,
											)}{" "}
											كجم
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">
											حديد الكمرات:
										</span>
										<p className="font-bold text-indigo-600">
											{formatNumber(
												combinedTotals.beamSteel,
											)}{" "}
											كجم
										</p>
									</div>
								</div>
								<div className="border-t mt-3 pt-3 grid grid-cols-2 gap-4">
									<div>
										<span className="text-muted-foreground text-xs">
											إجمالي الخرسانة:
										</span>
										<p className="font-bold text-lg">
											{formatNumber(
												combinedTotals.totalConcrete,
											)}{" "}
											م³
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">
											إجمالي الحديد:
										</span>
										<p className="font-bold text-lg">
											{formatNumber(
												combinedTotals.totalSteel,
											)}{" "}
											كجم
										</p>
									</div>
								</div>
							</div>
						)}
				</div>
			)}
		</>
	);
}
