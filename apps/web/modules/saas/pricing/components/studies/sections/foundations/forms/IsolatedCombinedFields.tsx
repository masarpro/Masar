"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";
import { REBAR_DIAMETERS } from "../../../../../constants/prices";
import {
	DimensionsCard,
	RebarMeshInput,
} from "../../../shared";
import type { FoundationFieldsProps } from "../types";

export function IsolatedCombinedFields({
	formData,
	setFormData,
	specs,
}: FoundationFieldsProps) {
	const t = useTranslations();

	return (
		<>
			{/* الأبعاد */}
			<DimensionsCard
				title="أبعاد القاعدة"
				dimensions={[
					{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
					{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
					{ key: "height", label: "الارتفاع", value: formData.height, unit: "م", step: 0.1 },
				]}
				onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
				calculatedVolume={formData.length * formData.width * formData.height * formData.quantity}
			/>

			{/* معلومات الأعمدة - للمشتركة فقط */}
			{formData.type === "combined" && (
				<div className="border rounded-lg p-3 space-y-3 bg-blue-50/50">
					<h5 className="text-sm font-medium text-blue-700">
						{t("pricing.studies.structural.combined.columnInfo")}
					</h5>
					<div className="grid grid-cols-2 gap-3 max-w-sm">
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.combined.columnCount")}</Label>
							<Input
								type="number"
								value={formData.combinedColumnCount}
								onChange={(e: any) => setFormData({ ...formData, combinedColumnCount: parseInt(e.target.value) || 2 })}
								min={2}
								max={6}
								className="h-8"
							/>
						</div>
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.combined.columnSpacing")} (م)</Label>
							<Input
								type="number"
								value={formData.combinedColumnSpacing}
								onChange={(e: any) => setFormData({ ...formData, combinedColumnSpacing: parseFloat(e.target.value) || 0 })}
								step={0.1}
								min={0}
								className="h-8"
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("pricing.studies.structural.combined.columnNote")}
					</p>
				</div>
			)}

			{/* حديد التسليح */}
			<div className="border-t pt-4 space-y-4">
				<h4 className="font-medium flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-primary" />
					تسليح القاعدة
				</h4>

				{/* الفرش السفلي */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-blue-700">الشبكة السفلية (الفرش)</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<RebarMeshInput
							title="الفرش السفلي"
							direction="الاتجاه القصير"
							diameter={formData.bottomShortDiameter}
							onDiameterChange={(d) => setFormData({ ...formData, bottomShortDiameter: d })}
							barsPerMeter={formData.bottomShortBarsPerMeter}
							onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomShortBarsPerMeter: n })}
							colorScheme="blue"
							availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12)}
							availableBarsPerMeter={[4, 5, 6, 7, 8]}
						/>
						<RebarMeshInput
							title="الفرش السفلي"
							direction="الاتجاه الطويل"
							diameter={formData.bottomLongDiameter}
							onDiameterChange={(d) => setFormData({ ...formData, bottomLongDiameter: d })}
							barsPerMeter={formData.bottomLongBarsPerMeter}
							onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomLongBarsPerMeter: n })}
							colorScheme="blue"
							availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12)}
							availableBarsPerMeter={[4, 5, 6, 7, 8]}
						/>
					</div>
				</div>

				{/* الغطاء العلوي */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="hasTopMesh"
							checked={formData.hasTopShort && formData.hasTopLong}
							disabled={formData.type === "combined"}
							onChange={(e: any) =>
								setFormData({
									...formData,
									hasTopShort: e.target.checked,
									hasTopLong: e.target.checked,
								})
							}
							className="rounded border-green-500"
						/>
						<Label htmlFor="hasTopMesh" className="text-sm font-medium text-green-700">
							الشبكة العلوية (الغطاء)
						</Label>
						{formData.type === "combined" && (
							<span className="text-xs text-muted-foreground ms-2">
								{t("pricing.studies.structural.combined.topMeshRequired")}
							</span>
						)}
					</div>
					{(formData.hasTopShort || formData.hasTopLong) && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<RebarMeshInput
								title="الغطاء العلوي"
								direction="الاتجاه القصير"
								diameter={formData.topShortDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, topShortDiameter: d })}
								barsPerMeter={formData.topShortBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, topShortBarsPerMeter: n })}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10 && d <= 16)}
								availableBarsPerMeter={[3, 4, 5, 6]}
							/>
							<RebarMeshInput
								title="الغطاء العلوي"
								direction="الاتجاه الطويل"
								diameter={formData.topLongDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, topLongDiameter: d })}
								barsPerMeter={formData.topLongBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, topLongBarsPerMeter: n })}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter(d => d >= 10 && d <= 16)}
								availableBarsPerMeter={[3, 4, 5, 6]}
							/>
						</div>
					)}
				</div>
			</div>

			{/* إعدادات متقدمة */}
			<div className="border-t pt-4 space-y-4">
				{/* الأغطية الخرسانية */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-purple-700">
						{t("pricing.studies.structural.covers.label")}
					</h5>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.covers.bottom")} (سم)</Label>
							<Input
								type="number"
								value={formData.foundationCoverBottom * 100}
								onChange={(e: any) => setFormData({ ...formData, foundationCoverBottom: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5}
								min={3}
								max={15}
								className="h-8"
							/>
						</div>
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.covers.top")} (سم)</Label>
							<Input
								type="number"
								value={formData.foundationCoverTop * 100}
								onChange={(e: any) => setFormData({ ...formData, foundationCoverTop: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5}
								min={3}
								max={15}
								className="h-8"
							/>
						</div>
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.covers.side")} (سم)</Label>
							<Input
								type="number"
								value={formData.foundationCoverSide * 100}
								onChange={(e: any) => setFormData({ ...formData, foundationCoverSide: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5}
								min={3}
								max={15}
								className="h-8"
							/>
						</div>
					</div>
				</div>

				{/* خرسانة النظافة */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="foundationHasLeanConcrete"
							checked={formData.foundationHasLeanConcrete}
							onChange={(e: any) => setFormData({ ...formData, foundationHasLeanConcrete: e.target.checked })}
							className="rounded border-gray-500"
						/>
						<Label htmlFor="foundationHasLeanConcrete" className="text-sm font-medium text-gray-700">
							{t("pricing.studies.structural.leanConcrete.label")}
						</Label>
					</div>
					{formData.foundationHasLeanConcrete && (
						<div className="w-48">
							<Label className="text-xs">{t("pricing.studies.structural.leanConcrete.thickness")} (سم)</Label>
							<Input
								type="number"
								value={formData.foundationLeanConcreteThickness * 100}
								onChange={(e: any) => setFormData({ ...formData, foundationLeanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
								step={1}
								min={5}
								max={20}
								className="h-8"
							/>
						</div>
					)}
				</div>

				{/* أسياخ انتظار الأعمدة */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="foundationHasColumnDowels"
							checked={formData.foundationHasColumnDowels}
							onChange={(e: any) => setFormData({ ...formData, foundationHasColumnDowels: e.target.checked })}
							className="rounded border-teal-500"
						/>
						<Label htmlFor="foundationHasColumnDowels" className="text-sm font-medium text-teal-700">
							{t("pricing.studies.structural.columnDowels.label")}
						</Label>
					</div>
					{formData.foundationHasColumnDowels && (
						<>
							<div className="grid grid-cols-3 gap-3 max-w-lg">
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.columnDowels.barsPerColumn")}</Label>
									<Select
										value={String(formData.foundationDowelBarsPerColumn)}
										onValueChange={(v: any) => setFormData({ ...formData, foundationDowelBarsPerColumn: parseInt(v) })}
									>
										<SelectTrigger className="h-8">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[4, 6, 8, 10, 12].map(n => (
												<SelectItem key={n} value={String(n)}>{n}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.columnDowels.diameter")} (مم)</Label>
									<Select
										value={String(formData.foundationDowelDiameter)}
										onValueChange={(v: any) => setFormData({ ...formData, foundationDowelDiameter: parseInt(v) })}
									>
										<SelectTrigger className="h-8">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{REBAR_DIAMETERS.filter(d => d >= 12).map(d => (
												<SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label className="text-xs">{t("pricing.studies.structural.columnDowels.developmentLength")} (م)</Label>
									<Input
										type="number"
										value={formData.foundationDowelDevLength}
										onChange={(e: any) => setFormData({ ...formData, foundationDowelDevLength: parseFloat(e.target.value) || 0 })}
										step={0.1}
										min={0.3}
										max={2}
										className="h-8"
									/>
								</div>
							</div>
							<p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
								{t("pricing.studies.structural.columnDowels.total", {
									columns: formData.type === "combined" ? formData.combinedColumnCount : 1,
									bars: formData.foundationDowelBarsPerColumn,
									total: (formData.type === "combined" ? formData.combinedColumnCount : 1) * formData.foundationDowelBarsPerColumn,
								})}
								{" "}Φ{formData.foundationDowelDiameter}
							</p>
						</>
					)}
				</div>
			</div>
		</>
	);
}
