"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import {
	Save,
	SkipForward,
	Plus,
	Minus,
	Building2,
} from "lucide-react";
import { toast } from "sonner";
import type {
	StructuralBuildingConfig,
	StructuralFloorConfig,
	StructuralFloorType,
} from "../../types/structural-building-config";
import {
	STRUCTURAL_FLOOR_DEFINITIONS,
	getUpperFloorLabel,
	createDefaultConfig,
} from "../../types/structural-building-config";
import { formatNumber } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface StructuralBuildingWizardProps {
	initialConfig?: StructuralBuildingConfig | null;
	existingItemCounts?: Record<string, number>; // floorId → item count
	onSave: (config: StructuralBuildingConfig) => Promise<void>;
	onSkip: () => void;
	isSaving?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function StructuralBuildingWizard({
	initialConfig,
	existingItemCounts = {},
	onSave,
	onSkip,
	isSaving = false,
}: StructuralBuildingWizardProps) {
	const [config, setConfig] = useState<StructuralBuildingConfig>(() => {
		if (initialConfig && initialConfig.floors.length > 0) {
			return { ...initialConfig };
		}
		return createDefaultConfig();
	});

	// Track how many upper floors exist
	const upperFloorCount = useMemo(
		() => config.floors.filter((f) => f.type === "upper").length,
		[config.floors],
	);

	// ─── Floor toggle helpers ───

	const isFloorTypeEnabled = (type: StructuralFloorType) =>
		config.floors.some((f) => f.type === type && f.enabled);

	const toggleFloorType = (type: StructuralFloorType) => {
		const def = STRUCTURAL_FLOOR_DEFINITIONS.find((d) => d.type === type);
		if (!def || def.alwaysEnabled) return;

		setConfig((prev) => {
			const existing = prev.floors.find((f) => f.type === type);
			if (existing) {
				// Toggle enabled
				const willDisable = existing.enabled;
				if (willDisable) {
					const count = existingItemCounts[existing.id] || 0;
					if (count > 0) {
						toast.warning(
							`هذا الدور له ${count} بنود — ستظل البنود موجودة لكن بدون دور مرتبط`,
						);
					}
				}
				return {
					...prev,
					floors: prev.floors.map((f) =>
						f.type === type ? { ...f, enabled: !f.enabled } : f,
					),
				};
			}
			// Add new floor of this type
			const maxSort = Math.max(0, ...prev.floors.map((f) => f.sortOrder));
			const newFloor: StructuralFloorConfig = {
				id: type,
				type,
				label: def.label,
				icon: def.icon,
				height: def.defaultHeight,
				slabArea: 0,
				sortOrder: maxSort + 1,
				isRepeated: type === "repeated",
				repeatCount: type === "repeated" ? 2 : 1,
				enabled: true,
				hasNeckColumns: def.hasNeckColumns,
			};
			return { ...prev, floors: [...prev.floors, newFloor] };
		});
	};

	const addUpperFloor = () => {
		setConfig((prev) => {
			const idx = prev.floors.filter((f) => f.type === "upper").length;
			const label = getUpperFloorLabel(idx);
			const maxSort = Math.max(0, ...prev.floors.map((f) => f.sortOrder));
			const newFloor: StructuralFloorConfig = {
				id: `upper_${idx}`,
				type: "upper",
				label,
				icon: "🏢",
				height: 3.0,
				slabArea: 0,
				sortOrder: maxSort + 1,
				isRepeated: false,
				repeatCount: 1,
				enabled: true,
			};
			return { ...prev, floors: [...prev.floors, newFloor] };
		});
	};

	const removeLastUpperFloor = () => {
		setConfig((prev) => {
			const uppers = prev.floors.filter((f) => f.type === "upper");
			if (uppers.length === 0) return prev;
			const lastUpper = uppers[uppers.length - 1];
			const count = existingItemCounts[lastUpper.id] || 0;
			if (count > 0) {
				toast.warning(
					`هذا الدور له ${count} بنود — ستظل البنود موجودة لكن بدون دور مرتبط`,
				);
			}
			return {
				...prev,
				floors: prev.floors.filter((f) => f.id !== lastUpper.id),
			};
		});
	};

	const updateFloor = (id: string, updates: Partial<StructuralFloorConfig>) => {
		setConfig((prev) => ({
			...prev,
			floors: prev.floors.map((f) =>
				f.id === id ? { ...f, ...updates } : f,
			),
		}));
	};

	// ─── Derived data ───

	const enabledFloors = useMemo(
		() =>
			config.floors
				.filter((f) => f.enabled)
				.sort((a, b) => a.sortOrder - b.sortOrder),
		[config.floors],
	);

	const totalArea = useMemo(
		() => enabledFloors.reduce((sum, f) => sum + f.slabArea * (f.isRepeated ? f.repeatCount : 1), 0),
		[enabledFloors],
	);

	// ─── Save ───

	const handleSave = useCallback(async () => {
		await onSave({ ...config, isComplete: true });
		toast.success("تم حفظ إعداد المبنى بنجاح");
	}, [config, onSave]);

	// ─── Render ───

	return (
		<Card className="border-2 border-primary/30 bg-primary/5">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Building2 className="h-6 w-6 text-primary" />
						<CardTitle className="text-lg">معالج إعداد المبنى الإنشائي</CardTitle>
					</div>
					<Button variant="ghost" size="sm" onClick={onSkip}>
						<SkipForward className="h-4 w-4 ml-1" />
						تخطي
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* ── Floor type toggles ── */}
				<div>
					<Label className="text-base font-semibold mb-3 block">اختر الأدوار:</Label>
					<div className="flex flex-wrap gap-2">
						{STRUCTURAL_FLOOR_DEFINITIONS.map((def) => {
							if (def.type === "upper") {
								// Upper floors: show add/remove controls
								return (
									<div key={def.type} className="flex items-center gap-1">
										<Button
											variant={upperFloorCount > 0 ? "primary" : "outline"}
											size="sm"
											onClick={addUpperFloor}
											className="gap-1"
										>
											<Plus className="h-3 w-3" />
											{def.icon} دور علوي
											{upperFloorCount > 0 && (
												<Badge variant="secondary" className="mr-1 text-xs">
													{upperFloorCount}
												</Badge>
											)}
										</Button>
										{upperFloorCount > 0 && (
											<Button
												variant="outline"
												size="icon"
												className="h-8 w-8"
												onClick={removeLastUpperFloor}
											>
												<Minus className="h-3 w-3" />
											</Button>
										)}
									</div>
								);
							}
							if (def.type === "repeated") {
								const isEnabled = isFloorTypeEnabled("repeated");
								return (
									<div key={def.type} className="flex items-center gap-1">
										<Button
											variant={isEnabled ? "primary" : "outline"}
											size="sm"
											onClick={() => toggleFloorType("repeated")}
											className="gap-1"
										>
											{def.icon} متكرر
										</Button>
										{isEnabled && (
											<div className="flex items-center gap-1">
												<span className="text-xs text-muted-foreground">×</span>
												<Input
													type="number"
													min={2}
													max={20}
													className="w-16 h-8 text-center"
													value={config.floors.find((f) => f.type === "repeated")?.repeatCount || 2}
													onChange={(e: any) => {
														const floor = config.floors.find((f) => f.type === "repeated");
														if (floor) {
															updateFloor(floor.id, { repeatCount: Math.max(2, +e.target.value) });
														}
													}}
												/>
											</div>
										)}
									</div>
								);
							}
							const isEnabled = isFloorTypeEnabled(def.type);
							return (
								<Button
									key={def.type}
									variant={isEnabled ? "primary" : "outline"}
									size="sm"
									onClick={() => toggleFloorType(def.type)}
									disabled={def.alwaysEnabled}
									className="gap-1"
								>
									{def.icon} {def.label}
									{def.alwaysEnabled && isEnabled && " ✓"}
								</Button>
							);
						})}
					</div>
				</div>

				{/* ── Floor details ── */}
				{enabledFloors.length > 0 && (
					<div>
						<Label className="text-base font-semibold mb-3 block">تفاصيل الأدوار المختارة:</Label>
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full text-sm">
								<thead className="bg-muted/50">
									<tr>
										<th className="text-right p-2 font-medium">الدور</th>
										<th className="text-right p-2 font-medium">الارتفاع (م)</th>
										<th className="text-right p-2 font-medium">مساحة السقف (م²)</th>
										{enabledFloors.some((f) => f.isRepeated) && (
											<th className="text-right p-2 font-medium">التكرار</th>
										)}
									</tr>
								</thead>
								<tbody>
									{enabledFloors.map((floor) => (
										<tr key={floor.id} className="border-t">
											<td className="p-2">
												<span className="flex items-center gap-2">
													<span>{floor.icon}</span>
													<span className="font-medium">{floor.label}</span>
												</span>
											</td>
											<td className="p-2">
												<Input
													type="number"
													step="0.1"
													min={0}
													className="w-24 h-8"
													value={floor.height || ""}
													onChange={(e: any) =>
														updateFloor(floor.id, { height: +e.target.value })
													}
												/>
											</td>
											<td className="p-2">
												<Input
													type="number"
													step="1"
													min={0}
													className="w-28 h-8"
													value={floor.slabArea || ""}
													onChange={(e: any) =>
														updateFloor(floor.id, { slabArea: +e.target.value })
													}
												/>
											</td>
											{enabledFloors.some((f) => f.isRepeated) && (
												<td className="p-2">
													{floor.isRepeated ? (
														<Badge variant="secondary">
															× {floor.repeatCount}
														</Badge>
													) : (
														<span className="text-muted-foreground text-xs">—</span>
													)}
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* ── Summary ── */}
				{enabledFloors.length > 0 && (
					<div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
						<div className="flex items-center gap-4 text-sm">
							<span>
								<span className="text-muted-foreground">عدد الأدوار:</span>{" "}
								<span className="font-bold">{enabledFloors.length}</span>
							</span>
							<span className="text-muted-foreground/50">|</span>
							<span>
								<span className="text-muted-foreground">إجمالي المساحة:</span>{" "}
								<span className="font-bold">{formatNumber(totalArea)} م²</span>
							</span>
						</div>
					</div>
				)}

				{/* ── Actions ── */}
				<div className="flex justify-end">
					<Button onClick={handleSave} disabled={isSaving}>
						<Save className="h-4 w-4 ml-2" />
						حفظ وبدء العمل
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
