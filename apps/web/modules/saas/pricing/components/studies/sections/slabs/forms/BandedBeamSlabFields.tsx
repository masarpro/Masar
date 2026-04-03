"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Plus,
	Trash2,
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
import { getDefaultBandedBeamTemplate } from "../types";
import type { SlabTypeFieldsProps, BandedBeamTemplateDef } from "../types";

export function BandedBeamSlabFields({
	formData,
	setFormData,
	calculations,
	bandedBeamTemplates,
	setBandedBeamTemplates,
	expandedBandedIds,
	setExpandedBandedIds,
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

			{/* جدول الكمرات العريضة */}
			<div className="border rounded-lg p-4 bg-indigo-50/30 space-y-3">
				<div className="flex items-center justify-between">
					<h5 className="font-medium text-indigo-700">
						جدول الكمرات
					</h5>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							const newT = getDefaultBandedBeamTemplate(bandedBeamTemplates.length, formData.length);
							setBandedBeamTemplates([...bandedBeamTemplates, newT]);
							setExpandedBandedIds([...expandedBandedIds, newT.id]);
						}}
					>
						<Plus className="h-4 w-4 ml-1" />
						إضافة نموذج كمرة
					</Button>
				</div>

				{bandedBeamTemplates.length === 0 && (
					<div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
						لم يتم إضافة نماذج كمرات — سيتم استخدام التقدير التلقائي
					</div>
				)}

				{bandedBeamTemplates.map((tmpl, idx) => {
					const isExpanded = expandedBandedIds.includes(tmpl.id);
					const updateTmpl = (updates: Partial<BandedBeamTemplateDef>) => {
						setBandedBeamTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, ...updates } : t));
					};
					return (
						<div key={tmpl.id} className="border rounded-lg bg-white">
							{/* Header row */}
							<div
								className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
								onClick={() => setExpandedBandedIds(prev =>
									prev.includes(tmpl.id) ? prev.filter(x => x !== tmpl.id) : [...prev, tmpl.id]
								)}
							>
								<div className="flex items-center gap-2">
									{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
									<span className="font-medium">{tmpl.name}</span>
									<Badge variant="secondary" className="text-xs">×{tmpl.quantity}</Badge>
									<span className="text-xs text-muted-foreground">
										{tmpl.width}×{tmpl.depth}م — {tmpl.length}م
									</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-red-500 hover:text-red-700"
									onClick={(e: any) => {
										e.stopPropagation();
										setBandedBeamTemplates(prev => prev.filter(t => t.id !== tmpl.id));
										setExpandedBandedIds(prev => prev.filter(x => x !== tmpl.id));
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>

							{/* Expanded content */}
							{isExpanded && (
								<div className="p-3 pt-0 space-y-3 border-t">
									{/* Row 1: Basic dimensions */}
									<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
										<div className="space-y-1">
											<Label className="text-xs">اسم النموذج</Label>
											<Input value={tmpl.name} onChange={(e: any) => updateTmpl({ name: e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">عدد التكرار</Label>
											<Input type="number" min={1} value={tmpl.quantity} onChange={(e: any) => updateTmpl({ quantity: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">طول الكمرة (م)</Label>
											<Input type="number" step="0.1" value={tmpl.length} onChange={(e: any) => updateTmpl({ length: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">عرض الكمرة (م)</Label>
											<Input type="number" step="0.1" value={tmpl.width} onChange={(e: any) => updateTmpl({ width: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">عمق الكمرة (م)</Label>
											<Input type="number" step="0.05" value={tmpl.depth} onChange={(e: any) => updateTmpl({ depth: +e.target.value })} />
										</div>
									</div>

									{/* Row 2: Bottom rebar */}
									<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
										<div className="space-y-1">
											<Label className="text-xs">سفلي مستمر - عدد</Label>
											<Input type="number" min={1} value={tmpl.bottomContCount} onChange={(e: any) => updateTmpl({ bottomContCount: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">سفلي مستمر - قطر</Label>
											<Select value={String(tmpl.bottomContDiameter)} onValueChange={(v: any) => updateTmpl({ bottomContDiameter: +v })}>
												<SelectTrigger><SelectValue /></SelectTrigger>
												<SelectContent>
													{REBAR_DIAMETERS.map(d => <SelectItem key={d} value={String(d)}>{d} مم</SelectItem>)}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1 flex items-end gap-2">
											<label className="flex items-center gap-1.5 text-xs cursor-pointer">
												<input
													type="checkbox"
													checked={tmpl.bottomAddEnabled}
													onChange={e => updateTmpl({ bottomAddEnabled: e.target.checked })}
													className="rounded"
												/>
												سفلي إضافي
											</label>
										</div>
										{tmpl.bottomAddEnabled && (
											<>
												<div className="space-y-1">
													<Label className="text-xs">إضافي - عدد</Label>
													<Input type="number" min={1} value={tmpl.bottomAddCount} onChange={(e: any) => updateTmpl({ bottomAddCount: +e.target.value })} />
												</div>
												<div className="space-y-1">
													<Label className="text-xs">إضافي - قطر</Label>
													<Select value={String(tmpl.bottomAddDiameter)} onValueChange={(v: any) => updateTmpl({ bottomAddDiameter: +v })}>
														<SelectTrigger><SelectValue /></SelectTrigger>
														<SelectContent>
															{REBAR_DIAMETERS.map(d => <SelectItem key={d} value={String(d)}>{d} مم</SelectItem>)}
														</SelectContent>
													</Select>
												</div>
											</>
										)}
									</div>

									{/* Row 3: Top rebar */}
									<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
										<div className="space-y-1">
											<Label className="text-xs">علوي مستمر - عدد</Label>
											<Input type="number" min={1} value={tmpl.topContCount} onChange={(e: any) => updateTmpl({ topContCount: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">علوي مستمر - قطر</Label>
											<Select value={String(tmpl.topContDiameter)} onValueChange={(v: any) => updateTmpl({ topContDiameter: +v })}>
												<SelectTrigger><SelectValue /></SelectTrigger>
												<SelectContent>
													{REBAR_DIAMETERS.map(d => <SelectItem key={d} value={String(d)}>{d} مم</SelectItem>)}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Row 4: Stirrups */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
										<div className="space-y-1">
											<Label className="text-xs">كانات - قطر</Label>
											<Select value={String(tmpl.stirrupDiameter)} onValueChange={(v: any) => updateTmpl({ stirrupDiameter: +v })}>
												<SelectTrigger><SelectValue /></SelectTrigger>
												<SelectContent>
													{REBAR_DIAMETERS.filter(d => d <= 12).map(d => <SelectItem key={d} value={String(d)}>{d} مم</SelectItem>)}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">تباعد ربع البحر (سم)</Label>
											<Input type="number" step="1" min={1} value={tmpl.stirrupSpacingQuarter} onChange={(e: any) => updateTmpl({ stirrupSpacingQuarter: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">تباعد المنتصف (سم)</Label>
											<Input type="number" step="1" min={1} value={tmpl.stirrupSpacingMid} onChange={(e: any) => updateTmpl({ stirrupSpacingMid: +e.target.value })} />
										</div>
										<div className="space-y-1">
											<Label className="text-xs">عدد الفروع</Label>
											<Select value={String(tmpl.stirrupLegs)} onValueChange={(v: any) => updateTmpl({ stirrupLegs: +v })}>
												<SelectTrigger><SelectValue /></SelectTrigger>
												<SelectContent>
													<SelectItem value="2">2 فرع</SelectItem>
													<SelectItem value="4">4 فروع</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
							)}
						</div>
					);
				})}
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
							id="hasTopMesh-banded"
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
							htmlFor="hasTopMesh-banded"
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
								id="showFormwork-banded"
								checked={showFormwork}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setShowFormwork(e.target.checked)}
								className="rounded"
							/>
							<Label
								htmlFor="showFormwork-banded"
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
