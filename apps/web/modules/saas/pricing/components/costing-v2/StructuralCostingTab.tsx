"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface StructuralCostingTabProps {
	organizationId: string;
	studyId: string;
	buildingArea: number;
}

type LaborMode = "subcontractor" | "per_sqm" | "salary";

export function StructuralCostingTab({
	organizationId,
	studyId,
	buildingArea,
}: StructuralCostingTabProps) {
	const [laborMode, setLaborMode] = useState<LaborMode>("subcontractor");

	// Fetch structural items
	const { data: items, isLoading } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	// Fetch costing items for this section
	const { data: costingItems } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "STRUCTURAL" },
		}),
	);

	const [prices, setPrices] = useState<Record<string, { material: string; labor: string; storage: string }>>({});

	const formatNum = (n: number | null | undefined) =>
		n != null ? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 }) : "—";

	const LABOR_MODES = [
		{ value: "subcontractor" as const, label: "مقاول باطن بالوحدة" },
		{ value: "per_sqm" as const, label: "بالمتر المسطح" },
		{ value: "salary" as const, label: "بالراتب الشهري" },
	];

	return (
		<div className="space-y-4">
			{/* Labor method selector */}
			<div className="rounded-xl border border-border bg-card p-4">
				<Label className="text-sm font-medium mb-3 block">
					طريقة حساب عمالة الإنشائي
				</Label>
				<div className="flex gap-2 flex-wrap">
					{LABOR_MODES.map((mode) => (
						<button
							key={mode.value}
							type="button"
							onClick={() => setLaborMode(mode.value)}
							className={cn(
								"px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
								laborMode === mode.value
									? "border-primary bg-primary/5 text-primary"
									: "border-border hover:border-muted-foreground/30",
							)}
						>
							{mode.label}
						</button>
					))}
				</div>
			</div>

			{/* Per-SQM mode */}
			{laborMode === "per_sqm" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-3">
					<h4 className="font-medium">مصنعيات عظم شاملة بالمتر المسطح</h4>
					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1">
							<Label className="text-xs">السعر (ريال/م²)</Label>
							<Input type="number" placeholder="0" className="rounded-lg" dir="ltr" />
						</div>
						<div className="space-y-1">
							<Label className="text-xs">مساحة البناء</Label>
							<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm" dir="ltr">
								{buildingArea.toLocaleString("ar-SA")} م²
							</div>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">الإجمالي</Label>
							<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm font-medium" dir="ltr">
								—
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Costing table */}
			{(laborMode === "subcontractor" || laborMode === "per_sqm") && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-muted-foreground">
									<th className="px-3 py-2.5 text-right font-medium">البند</th>
									<th className="px-3 py-2.5 text-center font-medium">الكمية</th>
									<th className="px-3 py-2.5 text-center font-medium">الوحدة</th>
									<th className="px-3 py-2.5 text-center font-medium">سعر المادة</th>
									{laborMode === "subcontractor" && (
										<th className="px-3 py-2.5 text-center font-medium">المصنعية</th>
									)}
									<th className="px-3 py-2.5 text-center font-medium">التشوين%</th>
									<th className="px-3 py-2.5 text-center font-medium">الإجمالي</th>
								</tr>
							</thead>
							<tbody>
								{isLoading && (
									<tr>
										<td colSpan={7} className="text-center py-8">
											<Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
										</td>
									</tr>
								)}
								{!isLoading && (items ?? []).length === 0 && (
									<tr>
										<td colSpan={7} className="text-center py-8 text-muted-foreground">
											لا توجد بنود إنشائية
										</td>
									</tr>
								)}
								{(items ?? []).map((item) => {
									const costingItem = (costingItems ?? []).find(
										(c) => c.description === item.name,
									);
									const p = prices[costingItem?.id ?? item.id] ?? {};
									return (
										<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
											<td className="px-3 py-2 font-medium">{item.name}</td>
											<td className="px-3 py-2 text-center" dir="ltr">
												{formatNum(Number(item.quantity))}
											</td>
											<td className="px-3 py-2 text-center">{item.unit}</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-20 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder="0"
													value={p.material ?? ""}
													onChange={(e) =>
														setPrices((prev) => ({
															...prev,
															[costingItem?.id ?? item.id]: {
																...prev[costingItem?.id ?? item.id],
																material: e.target.value,
															},
														}))
													}
												/>
											</td>
											{laborMode === "subcontractor" && (
												<td className="px-3 py-2">
													<Input
														type="number"
														className="h-8 w-20 mx-auto text-center rounded-lg"
														dir="ltr"
														placeholder="0"
														value={p.labor ?? ""}
														onChange={(e) =>
															setPrices((prev) => ({
																...prev,
																[costingItem?.id ?? item.id]: {
																	...prev[costingItem?.id ?? item.id],
																	labor: e.target.value,
																},
															}))
														}
													/>
												</td>
											)}
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-16 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder="2"
													value={p.storage ?? ""}
													onChange={(e) =>
														setPrices((prev) => ({
															...prev,
															[costingItem?.id ?? item.id]: {
																...prev[costingItem?.id ?? item.id],
																storage: e.target.value,
															},
														}))
													}
												/>
											</td>
											<td className="px-3 py-2 text-center font-medium" dir="ltr">
												{costingItem ? formatNum(Number(costingItem.totalCost)) : "—"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Salary mode */}
			{laborMode === "salary" && (
				<div className="rounded-xl border border-border bg-card p-4">
					<div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
						<p className="text-muted-foreground">
							وضع الراتب الشهري — قيد التطوير
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
