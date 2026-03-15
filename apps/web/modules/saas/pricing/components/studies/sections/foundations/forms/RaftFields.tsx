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

export function RaftFields({
	formData,
	setFormData,
}: FoundationFieldsProps) {
	const t = useTranslations();

	return (
		<>
			{/* الأبعاد */}
			<DimensionsCard
				title="أبعاد اللبشة"
				dimensions={[
					{ key: "length", label: "الطول", value: formData.length, unit: "م", step: 0.1 },
					{ key: "width", label: "العرض", value: formData.width, unit: "م", step: 0.1 },
					{ key: "thickness", label: "السماكة", value: formData.thickness, unit: "م", step: 0.1 },
				]}
				onDimensionChange={(key, value) => setFormData({ ...formData, [key]: value })}
				calculatedVolume={formData.length * formData.width * formData.thickness}
			/>

			{/* تسليح اللبشة */}
			<div className="border-t pt-4 space-y-4">
				<h4 className="font-medium flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-primary" />
					تسليح اللبشة
				</h4>

				{/* الشبكة السفلية */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-blue-700">الشبكة السفلية</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<RebarMeshInput title="الشبكة السفلية" direction="اتجاه X"
							diameter={formData.bottomXDiameter}
							onDiameterChange={(d) => setFormData({ ...formData, bottomXDiameter: d })}
							barsPerMeter={formData.bottomXBarsPerMeter}
							onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomXBarsPerMeter: n })}
							colorScheme="blue" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)} availableBarsPerMeter={[4, 5, 6, 7, 8]} />
						<RebarMeshInput title="الشبكة السفلية" direction="اتجاه Y"
							diameter={formData.bottomYDiameter}
							onDiameterChange={(d) => setFormData({ ...formData, bottomYDiameter: d })}
							barsPerMeter={formData.bottomYBarsPerMeter}
							onBarsPerMeterChange={(n) => setFormData({ ...formData, bottomYBarsPerMeter: n })}
							colorScheme="blue" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 14)} availableBarsPerMeter={[4, 5, 6, 7, 8]} />
					</div>
				</div>

				{/* الشبكة العلوية */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input type="checkbox" id="hasTopMeshRaft" checked={formData.hasTopMesh}
							onChange={(e: any) => setFormData({ ...formData, hasTopMesh: e.target.checked })}
							className="rounded border-green-500" />
						<Label htmlFor="hasTopMeshRaft" className="text-sm font-medium text-green-700">الشبكة العلوية</Label>
					</div>
					{formData.hasTopMesh && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<RebarMeshInput title="الشبكة العلوية" direction="اتجاه X"
								diameter={formData.topXDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, topXDiameter: d })}
								barsPerMeter={formData.topXBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, topXBarsPerMeter: n })}
								colorScheme="green" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)} availableBarsPerMeter={[3, 4, 5, 6]} />
							<RebarMeshInput title="الشبكة العلوية" direction="اتجاه Y"
								diameter={formData.topYDiameter}
								onDiameterChange={(d) => setFormData({ ...formData, topYDiameter: d })}
								barsPerMeter={formData.topYBarsPerMeter}
								onBarsPerMeterChange={(n) => setFormData({ ...formData, topYBarsPerMeter: n })}
								colorScheme="green" availableDiameters={REBAR_DIAMETERS.filter(d => d >= 12 && d <= 18)} availableBarsPerMeter={[3, 4, 5, 6]} />
						</div>
					)}
				</div>
			</div>

			{/* إعدادات متقدمة */}
			<div className="border-t pt-4 space-y-4">
				{/* الأغطية */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-purple-700">{t("pricing.studies.structural.raft.covers")}</h5>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.raft.coverBottom")} (سم)</Label>
							<Input type="number" value={formData.coverBottom * 100}
								onChange={(e: any) => setFormData({ ...formData, coverBottom: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5} min={3} max={15} className="h-8" />
						</div>
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.raft.coverTop")} (سم)</Label>
							<Input type="number" value={formData.coverTop * 100}
								onChange={(e: any) => setFormData({ ...formData, coverTop: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5} min={3} max={15} className="h-8" />
						</div>
						<div>
							<Label className="text-xs">{t("pricing.studies.structural.raft.coverSide")} (سم)</Label>
							<Input type="number" value={formData.coverSide * 100}
								onChange={(e: any) => setFormData({ ...formData, coverSide: parseFloat(e.target.value) / 100 || 0 })}
								step={0.5} min={3} max={15} className="h-8" />
						</div>
					</div>
				</div>

				{/* خرسانة النظافة */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input type="checkbox" id="hasLeanConcrete" checked={formData.hasLeanConcrete}
							onChange={(e: any) => setFormData({ ...formData, hasLeanConcrete: e.target.checked })}
							className="rounded border-gray-500" />
						<Label htmlFor="hasLeanConcrete" className="text-sm font-medium text-gray-700">
							{t("pricing.studies.structural.raft.leanConcrete")}
						</Label>
					</div>
					{formData.hasLeanConcrete && (
						<div className="w-48">
							<Label className="text-xs">{t("pricing.studies.structural.raft.leanConcreteThickness")} (سم)</Label>
							<Input type="number" value={formData.leanConcreteThickness * 100}
								onChange={(e: any) => setFormData({ ...formData, leanConcreteThickness: parseFloat(e.target.value) / 100 || 0 })}
								step={1} min={5} max={20} className="h-8" />
						</div>
					)}
				</div>

				{/* تسميك الحواف */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input type="checkbox" id="hasEdgeBeams" checked={formData.hasEdgeBeams}
							onChange={(e: any) => setFormData({ ...formData, hasEdgeBeams: e.target.checked })}
							className="rounded border-gray-500" />
						<Label htmlFor="hasEdgeBeams" className="text-sm font-medium text-gray-700">
							{t("pricing.studies.structural.raft.edgeBeams")}
						</Label>
					</div>
					{formData.hasEdgeBeams && (
						<div className="grid grid-cols-2 gap-3 max-w-sm">
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.edgeBeamWidth")} (م)</Label>
								<Input type="number" value={formData.edgeBeamWidth}
									onChange={(e: any) => setFormData({ ...formData, edgeBeamWidth: parseFloat(e.target.value) || 0 })}
									step={0.05} min={0.2} max={0.6} className="h-8" />
							</div>
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.edgeBeamDepth")} (م)</Label>
								<Input type="number" value={formData.edgeBeamDepth}
									onChange={(e: any) => setFormData({ ...formData, edgeBeamDepth: parseFloat(e.target.value) || 0 })}
									step={0.05} min={0.1} max={0.5} className="h-8" />
							</div>
						</div>
					)}
				</div>

				{/* وصلة التراكب */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-orange-700">{t("pricing.studies.structural.raft.lapSplice")}</h5>
					<div className="flex items-center gap-3">
						<div className="w-48">
							<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceMethod")}</Label>
							<Select value={formData.lapSpliceMethod} onValueChange={(v: any) => setFormData({ ...formData, lapSpliceMethod: v })}>
								<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="40d">40d</SelectItem>
									<SelectItem value="50d">50d</SelectItem>
									<SelectItem value="60d">60d</SelectItem>
									<SelectItem value="custom">{t("pricing.studies.structural.raft.lapSpliceCustom")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{formData.lapSpliceMethod === 'custom' && (
							<div className="w-36">
								<Label className="text-xs">{t("pricing.studies.structural.raft.lapSpliceCustom")} (م)</Label>
								<Input type="number" value={formData.customLapLength}
									onChange={(e: any) => setFormData({ ...formData, customLapLength: parseFloat(e.target.value) || 0 })}
									step={0.05} min={0.3} max={3} className="h-8" />
							</div>
						)}
					</div>
					{formData.length > 12 || formData.width > 12 ? (
						<p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
							⚠ {t("pricing.studies.structural.raft.lapSpliceNote")}
						</p>
					) : null}
				</div>

				{/* كراسي حديد */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<input type="checkbox" id="hasChairBars" checked={formData.hasChairBars}
							onChange={(e: any) => setFormData({ ...formData, hasChairBars: e.target.checked })}
							className="rounded border-gray-500" />
						<Label htmlFor="hasChairBars" className="text-sm font-medium text-gray-700">
							{t("pricing.studies.structural.raft.chairBars")}
						</Label>
					</div>
					{formData.hasChairBars && (
						<div className="grid grid-cols-3 gap-3 max-w-lg">
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.chairDiameter")} (مم)</Label>
								<Select value={String(formData.chairBarsDiameter)}
									onValueChange={(v: any) => setFormData({ ...formData, chairBarsDiameter: parseInt(v) })}>
									<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
									<SelectContent>{REBAR_DIAMETERS.filter(d => d >= 8 && d <= 14).map(d => <SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} X (م)</Label>
								<Input type="number" value={formData.chairBarsSpacingX}
									onChange={(e: any) => setFormData({ ...formData, chairBarsSpacingX: parseFloat(e.target.value) || 0 })}
									step={0.1} min={0.5} max={2} className="h-8" />
							</div>
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.chairSpacing")} Y (م)</Label>
								<Input type="number" value={formData.chairBarsSpacingY}
									onChange={(e: any) => setFormData({ ...formData, chairBarsSpacingY: parseFloat(e.target.value) || 0 })}
									step={0.1} min={0.5} max={2} className="h-8" />
							</div>
						</div>
					)}
				</div>

				{/* أسياخ انتظار الأعمدة */}
				<div className="space-y-3">
					<h5 className="text-sm font-medium text-teal-700">{t("pricing.studies.structural.raft.columnDowels")}</h5>
					<div className="w-48">
						<Select value={formData.columnDowelMode} onValueChange={(v: any) => setFormData({ ...formData, columnDowelMode: v })}>
							<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="none">{t("pricing.studies.structural.raft.columnDowelNone")}</SelectItem>
								<SelectItem value="manual">{t("pricing.studies.structural.raft.columnDowelManual")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{formData.columnDowelMode === 'manual' && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.columnCount")}</Label>
								<Input type="number" value={formData.columnDowelCount}
									onChange={(e: any) => setFormData({ ...formData, columnDowelCount: parseInt(e.target.value) || 0 })}
									min={0} className="h-8" />
							</div>
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.barsPerColumn")}</Label>
								<Select value={String(formData.columnDowelBarsPerColumn)}
									onValueChange={(v: any) => setFormData({ ...formData, columnDowelBarsPerColumn: parseInt(v) })}>
									<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
									<SelectContent>{[4, 6, 8, 10, 12].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-xs">Φ (مم)</Label>
								<Select value={String(formData.columnDowelDiameter)}
									onValueChange={(v: any) => setFormData({ ...formData, columnDowelDiameter: parseInt(v) })}>
									<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
									<SelectContent>{REBAR_DIAMETERS.filter(d => d >= 12).map(d => <SelectItem key={d} value={String(d)}>Φ{d}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-xs">{t("pricing.studies.structural.raft.developmentLength")} (م)</Label>
								<Input type="number" value={formData.columnDowelDevLength}
									onChange={(e: any) => setFormData({ ...formData, columnDowelDevLength: parseFloat(e.target.value) || 0 })}
									step={0.1} min={0.3} max={2} className="h-8" />
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
