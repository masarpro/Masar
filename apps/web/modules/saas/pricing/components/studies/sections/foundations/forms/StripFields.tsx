"use client";

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
import { useTranslations } from "next-intl";
import { REBAR_DIAMETERS } from "../../../../../constants/prices";
import { formatNumber } from "../../../../../lib/utils";
import {
	DimensionsCard,
	RebarMeshInput,
	RebarBarsInput,
	StirrupsInput,
} from "../../../shared";
import type { FoundationFieldsProps } from "../types";

export function StripFields({
	formData,
	setFormData,
}: FoundationFieldsProps) {
	const t = useTranslations();
	const stripMode = formData.width <= 0.8 ? 'stirrups' : 'mesh';

	return (
		<>
			{/* الأبعاد */}
			<DimensionsCard
				title="أبعاد القاعدة الشريطية"
				dimensions={[
					{ key: "stripLength", label: "الطول الكلي", value: formData.stripLength, unit: "م", step: 0.1 },
					{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.05 },
					{ key: "height", label: "الارتفاع", value: formData.height, unit: "م", step: 0.1 },
				]}
				onDimensionChange={(key, value) => {
					if (key === "stripLength") {
						setFormData({ ...formData, stripLength: value, segments: [{ length: value }] });
					} else {
						setFormData({ ...formData, [key]: value });
					}
				}}
				calculatedVolume={formData.stripLength * formData.width * formData.height * formData.quantity}
			/>
			<div className="flex items-center gap-2">
				<Badge variant={formData.width <= 0.8 ? "default" : "secondary"}>
					{formData.width <= 0.8
						? t("pricing.studies.structural.strip.rebarMode.stirrups")
						: t("pricing.studies.structural.strip.rebarMode.mesh")
					}
				</Badge>
				<span className="text-xs text-muted-foreground">
					{formData.width <= 0.8
						? t("pricing.studies.structural.strip.stirrupsMode")
						: t("pricing.studies.structural.strip.meshMode")
					}
					{" "}({formData.width <= 0.8 ? "≤80cm" : ">80cm"})
				</span>
			</div>

			{/* وضع الكانات */}
			{stripMode === 'stirrups' && (
				<div className="border-t pt-4 space-y-4">
					<h4 className="font-medium flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-primary" />
						تسليح القاعدة الشريطية — {t("pricing.studies.structural.strip.rebarMode.stirrups")}
					</h4>

					<div className="space-y-3">
						<h5 className="text-sm font-medium text-blue-700">الحديد الطولي الرئيسي (سفلي)</h5>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<RebarBarsInput
								title="الحديد الطولي الرئيسي"
								diameter={formData.bottomMainDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, bottomMainDiameter: d })}
								barsCount={formData.bottomMainCount}
								onBarsCountChange={(n) => setFormData({ ...formData, bottomMainCount: n })}
								colorScheme="blue"
								availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)}
								availableBarsCount={[4, 5, 6, 8, 10]}
							/>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<input type="checkbox" id="hasBottomSecondary" checked={formData.hasBottomSecondary}
								onChange={(e: any) => setFormData({ ...formData, hasBottomSecondary: e.target.checked })}
								className="rounded border-blue-500" />
							<Label htmlFor="hasBottomSecondary" className="text-sm font-medium text-blue-600">
								{t("pricing.studies.structural.strip.bottomSecondary")}
							</Label>
						</div>
						{formData.hasBottomSecondary && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<RebarBarsInput
									title={t("pricing.studies.structural.strip.bottomSecondary")}
									diameter={formData.bottomSecondaryDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, bottomSecondaryDiameter: d })}
									barsCount={formData.bottomSecondaryCount}
									onBarsCountChange={(n) => setFormData({ ...formData, bottomSecondaryCount: n })}
									colorScheme="blue"
									availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10)}
									availableBarsCount={[2, 3, 4, 5, 6]}
								/>
							</div>
						)}
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<input type="checkbox" id="hasTopMain" checked={formData.hasTopMain}
								onChange={(e: any) => setFormData({ ...formData, hasTopMain: e.target.checked })}
								className="rounded border-green-500" />
							<Label htmlFor="hasTopMain" className="text-sm font-medium text-green-700">
								{t("pricing.studies.structural.strip.topBars")}
							</Label>
						</div>
						{formData.hasTopMain && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<RebarBarsInput
									title={t("pricing.studies.structural.strip.topBars")}
									diameter={formData.topMainDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, topMainDiameter: d })}
									barsCount={formData.topMainCount}
									onBarsCountChange={(n) => setFormData({ ...formData, topMainCount: n })}
									colorScheme="green"
									availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10)}
									availableBarsCount={[2, 3, 4, 5, 6]}
								/>
							</div>
						)}
					</div>

					<div className="space-y-3">
						<h5 className="text-sm font-medium text-orange-700">الكانات</h5>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<StirrupsInput
								diameter={formData.stirrupDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, stirrupDiameter: d })}
								spacing={formData.stirrupSpacing}
								onSpacingChange={(s) => setFormData({ ...formData, stirrupSpacing: s })}
								availableDiameters={REBAR_DIAMETERS.filter(d => d <= 12)}
								availableSpacings={[150, 200, 250, 300]}
							/>
						</div>
					</div>
				</div>
			)}

			{/* وضع الشبكة */}
			{stripMode === 'mesh' && (
				<div className="border-t pt-4 space-y-4">
					<h4 className="font-medium flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-primary" />
						تسليح القاعدة الشريطية — {t("pricing.studies.structural.strip.rebarMode.mesh")}
					</h4>

					<div className="space-y-3">
						<h5 className="text-sm font-medium text-blue-700">{t("pricing.studies.structural.strip.bottomMesh")}</h5>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<RebarMeshInput title={t("pricing.studies.structural.strip.bottomMesh")} direction="اتجاه X"
								diameter={formData.stripBottomMeshXDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, stripBottomMeshXDiameter: d })}
								barsPerMeter={formData.stripBottomMeshXBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, stripBottomMeshXBarsPerMeter: n })}
								colorScheme="blue" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)} availableBarsPerMeter={[4, 5, 6, 7, 8]} />
							<RebarMeshInput title={t("pricing.studies.structural.strip.bottomMesh")} direction="اتجاه Y"
								diameter={formData.stripBottomMeshYDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, stripBottomMeshYDiameter: d })}
								barsPerMeter={formData.stripBottomMeshYBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, stripBottomMeshYBarsPerMeter: n })}
								colorScheme="blue" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)} availableBarsPerMeter={[4, 5, 6, 7, 8]} />
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<input type="checkbox" id="stripHasTopMesh" checked={formData.stripHasTopMesh}
								onChange={(e: any) => setFormData({ ...formData, stripHasTopMesh: e.target.checked })}
								className="rounded border-green-500" />
							<Label htmlFor="stripHasTopMesh" className="text-sm font-medium text-green-700">
								{t("pricing.studies.structural.strip.topMesh")}
							</Label>
						</div>
						{formData.stripHasTopMesh && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<RebarMeshInput title={t("pricing.studies.structural.strip.topMesh")} direction="اتجاه X"
									diameter={formData.stripTopMeshXDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, stripTopMeshXDiameter: d })}
									barsPerMeter={formData.stripTopMeshXBarsPerMeter}
									onBarsPerMeterChange={(n) => setFormData({ ...formData, stripTopMeshXBarsPerMeter: n })}
									colorScheme="green" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)} availableBarsPerMeter={[3, 4, 5, 6]} />
								<RebarMeshInput title={t("pricing.studies.structural.strip.topMesh")} direction="اتجاه Y"
									diameter={formData.stripTopMeshYDiameter}
									onDiameterChange={(d) => setFormData({ ...formData, stripTopMeshYDiameter: d })}
									barsPerMeter={formData.stripTopMeshYBarsPerMeter}
									onBarsPerMeterChange={(n) => setFormData({ ...formData, stripTopMeshYBarsPerMeter: n })}
									colorScheme="green" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)} availableBarsPerMeter={[3, 4, 5, 6]} />
							</div>
						)}
					</div>

					{/* وصلة التراكب */}
					<div className="space-y-3">
						<h5 className="text-sm font-medium text-orange-700">{t("pricing.studies.structural.raft.lapSplice")}</h5>
						<div className="flex items-center gap-3">
							<div className="w-48">
								<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceMethod")}</Label>
								<Select value={formData.stripLapSpliceMethod} onValueChange={(v: any) => setFormData({ ...formData, stripLapSpliceMethod: v })}>
									<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="40d">40d</SelectItem>
										<SelectItem value="50d">50d</SelectItem>
										<SelectItem value="60d">60d</SelectItem>
										<SelectItem value="custom">{t("pricing.studies.structural.raft.lapSpliceCustom")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{formData.stripLapSpliceMethod === 'custom' && (
								<div className="w-36">
									<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceCustom")} (م)</Label>
									<Input type="number" value={formData.stripCustomLapLength}
										onChange={(e: any) => setFormData({ ...formData, stripCustomLapLength: parseFloat(e.target.value) || 0 })}
										step={0.05} min={0.3} max={3} className="h-8" />
								</div>
							)}
						</div>
						{formData.stripLength > 12 ? (
							<p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
								{t("pricing.studies.structural.raft.lapSpliceNote")}
							</p>
						) : null}
					</div>
				</div>
			)}

			{/* إعدادات متقدمة */}
			<div className="border-t pt-4 space-y-4">
				<button type="button"
					className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900"
					onClick={() => setFormData({ ...formData, stripShowAdvanced: !formData.stripShowAdvanced })}
				>
					<span className={`transition-transform ${formData.stripShowAdvanced ? 'rotate-90' : ''}`}>&#9654;</span>
					{t("pricing.studies.structural.strip.advancedSettings")}
				</button>

				{formData.stripShowAdvanced && (
					<div className="space-y-4 ps-2 border-s-2 border-purple-200">
						{/* الأغطية */}
						<div className="space-y-3">
							<h5 className="text-sm font-medium text-purple-700">{t("pricing.studies.structural.covers.label")}</h5>
							<div className="grid grid-cols-3 gap-3">
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.covers.bottom")} (سم)</Label>
									<Input type="number" value={formData.stripCoverBottom * 100}
										onChange={(e: any) => setFormData({ ...formData, stripCoverBottom: parseFloat(e.target.value) / 100 || 0 })}
										step={0.5} min={3} max={15} className="h-8" />
								</div>
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.covers.top")} (سم)</Label>
									<Input type="number" value={formData.stripCoverTop * 100}
										onChange={(e: any) => setFormData({ ...formData, stripCoverTop: parseFloat(e.target.value) / 100 || 0 })}
										step={0.5} min={3} max={15} className="h-8" />
								</div>
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.covers.side")} (سم)</Label>
									<Input type="number" value={formData.stripCoverSide * 100}
										onChange={(e: any) => setFormData({ ...formData, stripCoverSide: parseFloat(e.target.value) / 100 || 0 })}
										step={0.5} min={3} max={15} className="h-8" />
								</div>
							</div>
						</div>

						{/* خرسانة النظافة */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<input type="checkbox" id="stripHasLeanConcrete" checked={formData.stripHasLeanConcrete}
									onChange={(e: any) => setFormData({ ...formData, stripHasLeanConcrete: e.target.checked })}
									className="rounded border-gray-500" />
								<Label htmlFor="stripHasLeanConcrete" className="text-sm font-medium text-gray-700">
									{t("pricing.studies.structural.leanConcrete.label")}
								</Label>
							</div>
							{formData.stripHasLeanConcrete && (
								<div className="w-48">
									<Label className="text-xs">{t("pricing.studies.structural.leanConcrete.thickness")} (سم)</Label>
									<Input type="number" value={formData.stripLeanConcreteThickness * 100}
										onChange={(e: any) => setFormData({ ...formData, stripLeanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
										step={1} min={5} max={20} className="h-8" />
								</div>
							)}
						</div>

						{/* خصم التقاطعات */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<input type="checkbox" id="stripHasIntersectionDeduction" checked={formData.stripHasIntersectionDeduction}
									onChange={(e: any) => setFormData({ ...formData, stripHasIntersectionDeduction: e.target.checked })}
									className="rounded border-amber-500" />
								<Label htmlFor="stripHasIntersectionDeduction" className="text-sm font-medium text-amber-700">
									{t("pricing.studies.structural.strip.intersectionDeduction")}
								</Label>
							</div>
							{formData.stripHasIntersectionDeduction && (
								<>
									<div className="grid grid-cols-2 gap-3 max-w-sm">
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.strip.intersectionCount")}</Label>
											<Input type="number" value={formData.stripIntersectionCount}
												onChange={(e: any) => setFormData({ ...formData, stripIntersectionCount: parseInt(e.target.value) || 0 })}
												min={0} max={50} className="h-8" />
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.strip.intersectingWidth")} (م)</Label>
											<Input type="number" value={formData.stripIntersectingStripWidth}
												onChange={(e: any) => setFormData({ ...formData, stripIntersectingStripWidth: parseFloat(e.target.value) || 0 })}
												step={0.05} min={0.2} max={2} className="h-8" />
										</div>
									</div>
									<p className="text-xs text-muted-foreground bg-amber-50 p-2 rounded">
										{t("pricing.studies.structural.strip.intersectionNote")}
									</p>
								</>
							)}
						</div>

						{/* أسياخ انتظار الأعمدة */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<input type="checkbox" id="stripHasColumnDowels" checked={formData.stripHasColumnDowels}
									onChange={(e: any) => setFormData({ ...formData, stripHasColumnDowels: e.target.checked })}
									className="rounded border-teal-500" />
								<Label htmlFor="stripHasColumnDowels" className="text-sm font-medium text-teal-700">
									{t("pricing.studies.structural.columnDowels.label")}
								</Label>
							</div>
							{formData.stripHasColumnDowels && (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									<div>
										<Label className="text-xs">{t("pricing.studies.structural.raft.columnCount")}</Label>
										<Input type="number" value={formData.stripColumnDowelCount}
											onChange={(e: any) => setFormData({ ...formData, stripColumnDowelCount: parseInt(e.target.value) || 0 })}
											min={0} className="h-8" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.studies.structural.raft.barsPerColumn")}</Label>
										<Select value={String(formData.stripColumnDowelBarsPerColumn)}
											onValueChange={(v: any) => setFormData({ ...formData, stripColumnDowelBarsPerColumn: parseInt(v) })}>
											<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
											<SelectContent>{[4, 6, 8, 10, 12].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
										</Select>
									</div>
									<div>
										<Label className="text-xs">Φ (مم)</Label>
										<Select value={String(formData.stripColumnDowelDiameter)}
											onValueChange={(v: any) => setFormData({ ...formData, stripColumnDowelDiameter: parseInt(v) })}>
											<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
											<SelectContent>{REBAR_DIAMETERS.filter(d => d >= 12).map(d => <SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>)}</SelectContent>
										</Select>
									</div>
									<div>
										<Label className="text-xs">{t("pricing.studies.structural.raft.developmentLength")} (م)</Label>
										<Input type="number" value={formData.stripColumnDowelDevLength}
											onChange={(e: any) => setFormData({ ...formData, stripColumnDowelDevLength: parseFloat(e.target.value) || 0 })}
											step={0.1} min={0.3} max={2} className="h-8" />
									</div>
								</div>
							)}
						</div>

						{/* كراسي حديد — mesh mode only */}
						{formData.width > 0.8 && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<input type="checkbox" id="stripHasChairBars" checked={formData.stripHasChairBars}
										onChange={(e: any) => setFormData({ ...formData, stripHasChairBars: e.target.checked })}
										className="rounded border-gray-500" />
									<Label htmlFor="stripHasChairBars" className="text-sm font-medium text-gray-700">
										{t("pricing.studies.structural.raft.chairBars")}
									</Label>
								</div>
								{formData.stripHasChairBars && (
									<div className="grid grid-cols-3 gap-3 max-w-lg">
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.chairDiameter")} (مم)</Label>
											<Select value={String(formData.stripChairBarsDiameter)}
												onValueChange={(v: any) => setFormData({ ...formData, stripChairBarsDiameter: parseInt(v) })}>
												<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
												<SelectContent>{REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14).map(d => <SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>)}</SelectContent>
											</Select>
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} X (م)</Label>
											<Input type="number" value={formData.stripChairBarsSpacingX}
												onChange={(e: any) => setFormData({ ...formData, stripChairBarsSpacingX: parseFloat(e.target.value) || 0 })}
												step={0.1} min={0.5} max={2} className="h-8" />
										</div>
										<div>
											<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} Y (م)</Label>
											<Input type="number" value={formData.stripChairBarsSpacingY}
												onChange={(e: any) => setFormData({ ...formData, stripChairBarsSpacingY: parseFloat(e.target.value) || 0 })}
												step={0.1} min={0.5} max={2} className="h-8" />
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}
