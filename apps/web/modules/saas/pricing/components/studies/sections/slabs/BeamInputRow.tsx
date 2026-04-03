"use client";

import { useMemo } from "react";
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
	Trash2,
	ChevronDown,
	ChevronLeft,
} from "lucide-react";
import { REBAR_DIAMETERS } from "../../../../constants/prices";
import { formatNumber } from "../../../../lib/utils";
import {
	RebarBarsInput,
	StirrupsInput,
} from "../../shared";
import { computeBeamCalc } from "./helpers";
import type { BeamInputRowProps } from "./types";

export function BeamInputRow({
	beam,
	index,
	isExpanded,
	onToggle,
	onChange,
	onRemove,
	concreteType,
}: BeamInputRowProps) {
	const calc = useMemo(() => computeBeamCalc(beam, concreteType), [beam, concreteType]);

	return (
		<div className="border rounded-lg overflow-hidden bg-background">
			{/* رأس الكمرة - ملخص */}
			<button
				type="button"
				className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-sm"
				onClick={onToggle}
			>
				<div className="flex items-center gap-3">
					{isExpanded ? (
						<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
					) : (
						<ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
					)}
					<span className="text-base">📏</span>
					<span className="font-semibold">{beam.name}</span>
					<Badge variant="outline" className="text-xs">
						{beam.quantity} كمرة
					</Badge>
					<span className="text-xs text-muted-foreground">
						{beam.width}×{beam.height} سم × {beam.length} م
					</span>
				</div>
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span>
						خرسانة:{" "}
						<span className="font-semibold text-blue-600">
							{formatNumber(calc.concreteVolume)} م³
						</span>
					</span>
					<span>
						حديد:{" "}
						<span className="font-semibold text-orange-600">
							{formatNumber(calc.grossWeight)} كجم
						</span>
					</span>
				</div>
			</button>

			{/* تفاصيل الكمرة */}
			{isExpanded && (
				<div className="px-3 pb-3 border-t space-y-3">
					{/* الاسم والعدد */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
						<div className="space-y-1">
							<Label className="text-xs">اسم الكمرة</Label>
							<Input
								value={beam.name}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({ ...beam, name: e.target.value })
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">العدد</Label>
							<Input
								type="number"
								min={1}
								value={beam.quantity}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({
										...beam,
										quantity: Math.max(1, parseInt(e.target.value) || 1),
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">العرض (سم)</Label>
							<Select
								value={beam.width.toString()}
								onValueChange={(v: any) =>
									onChange({ ...beam, width: +v })
								}
							>
								<SelectTrigger className="h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[20, 25, 30, 35, 40, 50, 60].map((w) => (
										<SelectItem key={w} value={w.toString()}>
											{w} سم
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">الارتفاع (سم)</Label>
							<Select
								value={beam.height.toString()}
								onValueChange={(v: any) =>
									onChange({ ...beam, height: +v })
								}
							>
								<SelectTrigger className="h-8 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[30, 40, 50, 60, 70, 80, 90, 100].map((h) => (
										<SelectItem key={h} value={h.toString()}>
											{h} سم
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* الطول */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="space-y-1">
							<Label className="text-xs">الطول (م)</Label>
							<Input
								type="number"
								min={0.5}
								step={0.1}
								value={beam.length}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onChange({
										...beam,
										length: Math.max(0.5, parseFloat(e.target.value) || 1),
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="bg-blue-50/50 dark:bg-blue-950/20 rounded p-2 flex flex-col justify-center items-center">
							<span className="text-xs text-muted-foreground">
								حجم الخرسانة
							</span>
							<span className="font-bold text-sm text-blue-700">
								{formatNumber(calc.concreteVolume)} م³
							</span>
						</div>
					</div>

					{/* التسليح */}
					<div className="space-y-2">
						<h6 className="text-xs font-semibold text-muted-foreground">
							التسليح
						</h6>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
							<RebarBarsInput
								title="حديد سفلي (شد)"
								diameter={beam.bottomBarDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, bottomBarDiameter: d })
								}
								barsCount={beam.bottomBarsCount}
								onBarsCountChange={(n) =>
									onChange({ ...beam, bottomBarsCount: n })
								}
								colorScheme="blue"
								availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
								availableBarsCount={[2, 3, 4, 5, 6, 8]}
							/>
							<RebarBarsInput
								title="حديد علوي (ضغط)"
								diameter={beam.topBarDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, topBarDiameter: d })
								}
								barsCount={beam.topBarsCount}
								onBarsCountChange={(n) =>
									onChange({ ...beam, topBarsCount: n })
								}
								colorScheme="green"
								availableDiameters={REBAR_DIAMETERS.filter((d) => d >= 12)}
								availableBarsCount={[2, 3, 4, 5, 6]}
							/>
							<StirrupsInput
								diameter={beam.stirrupDiameter}
								onDiameterChange={(d) =>
									onChange({ ...beam, stirrupDiameter: d })
								}
								spacing={beam.stirrupSpacing}
								onSpacingChange={(s) =>
									onChange({ ...beam, stirrupSpacing: s })
								}
								availableDiameters={REBAR_DIAMETERS.filter((d) => d <= 10)}
								availableSpacings={[100, 125, 150, 175, 200, 250]}
							/>
						</div>
					</div>

					{/* نتائج الكمرة */}
					<div className="bg-muted/30 rounded-lg p-2 grid grid-cols-3 gap-3 text-xs">
						<div>
							<span className="text-muted-foreground">خرسانة: </span>
							<span className="font-bold">
								{formatNumber(calc.concreteVolume)} م³
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">حديد (صافي): </span>
							<span className="font-bold">
								{formatNumber(calc.netWeight)} كجم
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">حديد (إجمالي): </span>
							<span className="font-bold">
								{formatNumber(calc.grossWeight)} كجم
							</span>
						</div>
					</div>

					{/* زر الحذف */}
					<div className="flex justify-end">
						<Button
							variant="ghost"
							size="sm"
							className="text-destructive hover:text-destructive text-xs"
							onClick={onRemove}
						>
							<Trash2 className="h-3.5 w-3.5 ml-1" />
							حذف الكمرة
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
