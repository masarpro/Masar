"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
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
	X,
	ChevronDown,
	ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { calculateColumnRebar } from "../../../../lib/structural-calculations";
import { formatNumber } from "../../../../lib/utils";
import { NECK_HEIGHT_PRESETS } from "./types";
import type { NeckColumnsSectionProps } from "./types";

export function NeckColumnsSection({
	groundColumns,
	neckHeight,
	onNeckHeightChange,
	onDisable,
	specs,
}: NeckColumnsSectionProps) {
	const t = useTranslations();
	const [showCuttingDetails, setShowCuttingDetails] = useState(false);

	const neckCalcs = useMemo(() => {
		return groundColumns.map((col) => {
			const width = col.dimensions?.width || 30;
			const depth = col.dimensions?.depth || 30;
			const mainBarsCount = col.dimensions?.mainBarsCount || 8;
			const mainBarDiameter = col.dimensions?.mainBarDiameter || 16;
			const stirrupDiameter = col.dimensions?.stirrupDiameter || 8;
			const stirrupSpacing = col.dimensions?.stirrupSpacing || 150;
			const isCircular = !!col.dimensions?.shape;
			const diameter = col.dimensions?.diameter || 40;

			const calc = calculateColumnRebar({
				quantity: col.quantity,
				width,
				depth,
				height: neckHeight,
				mainBarsCount,
				mainBarDiameter,
				stirrupDiameter,
				stirrupSpacing,
				concreteType: specs?.concreteType || "C35",
				shape: isCircular ? "circular" : "rectangular",
				diameter,
			});

			return {
				name: col.name,
				quantity: col.quantity,
				width,
				depth,
				mainBarsCount,
				mainBarDiameter,
				stirrupDiameter,
				stirrupSpacing,
				isCircular,
				diameter,
				calc,
			};
		});
	}, [groundColumns, neckHeight, specs]);

	const totalConcrete = neckCalcs.reduce(
		(s, n) => s + n.calc.concreteVolume,
		0,
	);
	const totalSteel = neckCalcs.reduce(
		(s, n) => s + n.calc.totals.grossWeight,
		0,
	);

	if (groundColumns.length === 0) {
		return (
			<div className="rounded-xl border-2 border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 p-6 text-center">
				<p className="text-sm text-muted-foreground">
					أضف أعمدة الدور الأرضي أولاً ليتم نسخها كرقاب تلقائياً
				</p>
			</div>
		);
	}

	return (
		<Card className="border-amber-200/50 bg-amber-50/10 dark:bg-amber-950/10">
			<CardContent className="p-4 space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-lg">⬇️</span>
						<h4 className="font-semibold">رقاب الأعمدة</h4>
						<Badge
							variant="secondary"
							className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
						>
							{groundColumns.length} رقبة
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground hover:text-destructive"
						onClick={onDisable}
					>
						<X className="h-4 w-4 ml-1" />
						إزالة
					</Button>
				</div>

				<p className="text-xs text-muted-foreground">
					الرقاب تُنسخ تلقائياً من أعمدة الدور الأرضي بنفس الأبعاد والتسليح
					— فقط الارتفاع يتم تغييره
				</p>

				{/* Height selector */}
				<div className="flex flex-wrap items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 rounded-lg p-3">
					<Label className="font-medium text-sm whitespace-nowrap">
						ارتفاع الرقبة:
					</Label>
					<div className="flex gap-1.5">
						{NECK_HEIGHT_PRESETS.map((h) => (
							<Button
								key={h}
								variant={neckHeight === h ? "primary" : "outline"}
								size="sm"
								className={`h-8 px-3 ${neckHeight === h ? "bg-amber-600 hover:bg-amber-700" : ""}`}
								onClick={() => onNeckHeightChange(h)}
							>
								{h} م
							</Button>
						))}
					</div>
					<div className="flex items-center gap-1.5">
						<Input
							type="number"
							min={0.5}
							max={10}
							step={0.5}
							value={neckHeight}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onNeckHeightChange(
									Math.max(0.5, parseFloat(e.target.value) || 1),
								)
							}
							className="w-20 h-8 text-center"
						/>
						<span className="text-xs text-muted-foreground">م</span>
					</div>
				</div>

				{/* Table */}
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">رقبة العمود</TableHead>
								<TableHead className="text-right">العدد</TableHead>
								<TableHead className="text-right">الأبعاد</TableHead>
								<TableHead className="text-right">التسليح</TableHead>
								<TableHead className="text-right">الخرسانة</TableHead>
								<TableHead className="text-right">الحديد</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{neckCalcs.map((neck, idx) => (
								<TableRow key={idx} className="bg-amber-50/20 dark:bg-amber-950/10">
									<TableCell className="font-medium">
										رقبة {neck.name}
									</TableCell>
									<TableCell>{neck.quantity}</TableCell>
									<TableCell className="text-sm">
										{neck.width}×{neck.depth} سم × {neckHeight} م
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{neck.mainBarsCount}∅{neck.mainBarDiameter} + ك∅
										{neck.stirrupDiameter}/{neck.stirrupSpacing}
									</TableCell>
									<TableCell>
										{formatNumber(neck.calc.concreteVolume)} م³
									</TableCell>
									<TableCell>
										{formatNumber(neck.calc.totals.grossWeight)} كجم
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Cutting details - expandable */}
				<div className="space-y-2">
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-xs"
						onClick={() => setShowCuttingDetails(!showCuttingDetails)}
					>
						{showCuttingDetails ? (
							<ChevronDown className="h-3 w-3" />
						) : (
							<ChevronLeft className="h-3 w-3" />
						)}
						تفاصيل القص والحديد
					</Button>

					{showCuttingDetails && (
						<div className="space-y-3">
							{neckCalcs.map((neck, idx) => (
								<div key={idx} className="border rounded-lg p-3 bg-background">
									<h5 className="text-sm font-medium mb-2">
										رقبة {neck.name} ({neck.quantity} رقبة)
									</h5>
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
											{neck.calc.cuttingDetails.map((d, di) => (
												<TableRow key={di}>
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
														{d.stocksNeeded} × {d.stockLength}م
													</TableCell>
													<TableCell className="text-xs">
														{d.wastePercentage}%
													</TableCell>
													<TableCell className="text-xs">
														{formatNumber(d.weight)} كجم
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Totals */}
				<div className="bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-3">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								إجمالي خرسانة الرقاب:
							</span>
							<span className="font-bold mr-1">
								{formatNumber(totalConcrete)} م³
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								إجمالي حديد الرقاب:
							</span>
							<span className="font-bold mr-1">
								{formatNumber(totalSteel)} كجم
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
