"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	ChevronDown,
	ChevronLeft,
	LayoutList,
	Layers,
	Loader2,
	Package,
	RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";

interface BOMSectionProps {
	organizationId: string;
	studyId: string;
}

type BOMViewMode = "byItem" | "byMaterial";

export function BOMSection({ organizationId, studyId }: BOMSectionProps) {
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(true);
	const [viewMode, setViewMode] = useState<BOMViewMode>("byItem");

	const { data: bomEntries, isLoading } = useQuery(
		orpc.pricing.studies.specifications.getBOM.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const generateMutation = useMutation(
		orpc.pricing.studies.specifications.generateBOM.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "specifications"],
				});
			},
		}),
	);

	const handleGenerate = () => {
		generateMutation.mutate({ organizationId, studyId });
	};

	// Group BOM by parentItemType then parentCategory
	const grouped = (bomEntries ?? []).reduce(
		(acc, entry) => {
			const typeKey = String(entry.parentItemType);
			if (!acc[typeKey]) acc[typeKey] = {};
			const catKey = entry.parentCategory ?? "عام";
			if (!acc[typeKey][catKey]) acc[typeKey][catKey] = [];
			acc[typeKey][catKey].push(entry);
			return acc;
		},
		{} as Record<string, Record<string, typeof bomEntries>>,
	);

	const typeLabels: Record<string, string> = {
		STRUCTURAL: "إنشائي",
		FINISHING: "تشطيبات",
		MEP: "كهروميكانيكية",
	};

	// Aggregate by material name + unit for "by material" view
	const aggregatedByMaterial = useMemo(() => {
		if (!bomEntries?.length) return [];
		const map = new Map<string, {
			materialName: string;
			materialNameEn: string | null;
			unit: string;
			totalQuantity: number;
			totalEffective: number;
			usedIn: string[];
		}>();

		for (const entry of bomEntries) {
			const key = `${entry.materialName}_${entry.unit}`;
			if (!map.has(key)) {
				map.set(key, {
					materialName: entry.materialName,
					materialNameEn: entry.materialNameEn,
					unit: entry.unit,
					totalQuantity: 0,
					totalEffective: 0,
					usedIn: [],
				});
			}
			const agg = map.get(key)!;
			agg.totalQuantity += Number(entry.quantity);
			agg.totalEffective += Number(entry.effectiveQuantity);
			const catLabel = entry.parentCategory ?? "عام";
			if (!agg.usedIn.includes(catLabel)) {
				agg.usedIn.push(catLabel);
			}
		}

		return Array.from(map.values()).sort((a, b) =>
			a.materialName.localeCompare(b.materialName, "ar"),
		);
	}, [bomEntries]);

	const hasEntries = (bomEntries ?? []).length > 0;

	return (
		<div className="rounded-xl border border-border bg-card" dir="rtl">
			{/* Header */}
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-primary/10">
						<Package className="h-5 w-5 text-primary" />
					</div>
					<div className="text-right">
						<h3 className="font-semibold">جدول المواد المُجمّع (BOM)</h3>
						<p className="text-xs text-muted-foreground">
							{hasEntries
								? `${(bomEntries ?? []).length} مادة`
								: "لم يتم استخراج المواد بعد"}
						</p>
					</div>
				</div>
				{expanded ? (
					<ChevronDown className="h-5 w-5 text-muted-foreground" />
				) : (
					<ChevronLeft className="h-5 w-5 text-muted-foreground" />
				)}
			</button>

			{expanded && (
				<div className="px-4 pb-4 space-y-4">
					{/* Toolbar: view toggle + generate */}
					<div className="flex items-center justify-between">
						{hasEntries ? (
							<div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/30">
								<button
									type="button"
									onClick={() => setViewMode("byItem")}
									className={cn(
										"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										viewMode === "byItem"
											? "bg-background shadow-sm text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<LayoutList className="h-3.5 w-3.5" />
									حسب البند
								</button>
								<button
									type="button"
									onClick={() => setViewMode("byMaterial")}
									className={cn(
										"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										viewMode === "byMaterial"
											? "bg-background shadow-sm text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<Layers className="h-3.5 w-3.5" />
									حسب المادة
								</button>
							</div>
						) : (
							<div />
						)}
						<Button
							onClick={handleGenerate}
							disabled={generateMutation.isPending}
							variant="outline"
							size="sm"
							className="gap-2 rounded-lg"
						>
							{generateMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4" />
							)}
							{hasEntries ? "إعادة استخراج المواد" : "استخراج المواد"}
						</Button>
					</div>

					{isLoading && (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					)}

					{!isLoading && !hasEntries && (
						<div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
							<Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
							<p className="text-muted-foreground text-sm">
								اضغط "استخراج المواد" لاستخراج جدول المواد من المواصفات المختارة
							</p>
						</div>
					)}

					{/* By Item View */}
					{!isLoading && hasEntries && viewMode === "byItem" && (
						<div className="space-y-4">
							{Object.entries(grouped).map(([typeKey, categories]) => (
								<div key={typeKey} className="space-y-2">
									<h4 className="text-sm font-semibold text-muted-foreground">
										{typeLabels[typeKey] ?? typeKey}
									</h4>
									{Object.entries(categories ?? {}).map(([catKey, items]) => (
										<div
											key={catKey}
											className="rounded-lg border border-border overflow-hidden"
										>
											<div className="bg-muted/30 px-3 py-2 text-sm font-medium">
												{catKey}
											</div>
											<div className="overflow-x-auto">
												<table className="w-full text-sm">
													<thead>
														<tr className="border-b text-muted-foreground">
															<th className="px-3 py-2 text-right font-medium">
																المادة
															</th>
															<th className="px-3 py-2 text-center font-medium">
																الكمية
															</th>
															<th className="px-3 py-2 text-center font-medium">
																الوحدة
															</th>
															<th className="px-3 py-2 text-center font-medium">
																الهالك%
															</th>
															<th className="px-3 py-2 text-center font-medium">
																الكمية الفعلية
															</th>
														</tr>
													</thead>
													<tbody>
														{(items ?? []).map((entry) => (
															<tr
																key={entry.id}
																className="border-b last:border-0 hover:bg-muted/20"
															>
																<td className="px-3 py-2 font-medium">
																	{entry.materialName}
																	{entry.materialNameEn && (
																		<span className="text-xs text-muted-foreground mr-2">
																			({entry.materialNameEn})
																		</span>
																	)}
																</td>
																<td className="px-3 py-2 text-center" dir="ltr">
																	{Number(entry.quantity).toLocaleString("ar-SA", {
																		maximumFractionDigits: 2,
																	})}
																</td>
																<td className="px-3 py-2 text-center">
																	{entry.unit}
																</td>
																<td className="px-3 py-2 text-center" dir="ltr">
																	{Number(entry.wastagePercent)}%
																</td>
																<td className="px-3 py-2 text-center font-medium" dir="ltr">
																	{Number(entry.effectiveQuantity).toLocaleString(
																		"ar-SA",
																		{ maximumFractionDigits: 2 },
																	)}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									))}
								</div>
							))}
						</div>
					)}

					{/* By Material View (aggregated) */}
					{!isLoading && hasEntries && viewMode === "byMaterial" && (
						<div className="rounded-lg border border-border overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/30 text-muted-foreground">
											<th className="px-3 py-2.5 text-right font-medium">#</th>
											<th className="px-3 py-2.5 text-right font-medium">المادة</th>
											<th className="px-3 py-2.5 text-center font-medium">الوحدة</th>
											<th className="px-3 py-2.5 text-center font-medium">إجمالي الكمية</th>
											<th className="px-3 py-2.5 text-center font-medium">الكمية الفعلية</th>
											<th className="px-3 py-2.5 text-right font-medium">مستخدمة في</th>
										</tr>
									</thead>
									<tbody>
										{aggregatedByMaterial.map((mat, idx) => (
											<tr
												key={`${mat.materialName}_${mat.unit}`}
												className="border-b last:border-0 hover:bg-muted/20"
											>
												<td className="px-3 py-2 text-muted-foreground text-xs">
													{idx + 1}
												</td>
												<td className="px-3 py-2 font-medium">
													{mat.materialName}
													{mat.materialNameEn && (
														<span className="text-xs text-muted-foreground mr-2">
															({mat.materialNameEn})
														</span>
													)}
												</td>
												<td className="px-3 py-2 text-center">
													{mat.unit}
												</td>
												<td className="px-3 py-2 text-center" dir="ltr">
													{mat.totalQuantity.toLocaleString("ar-SA", {
														maximumFractionDigits: 2,
													})}
												</td>
												<td className="px-3 py-2 text-center font-medium" dir="ltr">
													{mat.totalEffective.toLocaleString("ar-SA", {
														maximumFractionDigits: 2,
													})}
												</td>
												<td className="px-3 py-2">
													<div className="flex flex-wrap gap-1">
														{mat.usedIn.map((cat) => (
															<span
																key={cat}
																className="inline-block text-xs bg-muted px-2 py-0.5 rounded-full"
															>
																{cat}
															</span>
														))}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{/* Summary footer */}
							<div className="bg-muted/20 px-3 py-2 text-xs text-muted-foreground border-t">
								إجمالي المواد: {aggregatedByMaterial.length} مادة مختلفة
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
