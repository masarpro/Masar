"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@ui/components/input";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";

interface FinishingCostingTabProps {
	organizationId: string;
	studyId: string;
}

export function FinishingCostingTab({
	organizationId,
	studyId,
}: FinishingCostingTabProps) {
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

	// Fetch BOM entries for finishing items
	const { data: bomEntries, isLoading: bomLoading } = useQuery(
		orpc.pricing.studies.specifications.getBOM.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Fetch costing items for finishing section
	const { data: costingItems } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "FINISHING" },
		}),
	);

	const [prices, setPrices] = useState<
		Record<string, { unitPrice: string; laborRate: string; storagePercent: string }>
	>({});

	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	// Filter BOM to finishing items only and group by parentItemId
	const finishingBOM = (bomEntries ?? []).filter(
		(e) => String(e.parentItemType) === "FINISHING",
	);

	const groupedByParent = finishingBOM.reduce(
		(acc, entry) => {
			const key = entry.parentItemId;
			if (!acc[key]) {
				acc[key] = {
					category: entry.parentCategory ?? "عام",
					materials: [],
				};
			}
			acc[key].materials.push(entry);
			return acc;
		},
		{} as Record<string, { category: string; materials: typeof finishingBOM }>,
	);

	const toggleItem = (id: string) => {
		setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	if (bomLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (finishingBOM.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center">
				<p className="text-muted-foreground">
					لا توجد مواد تشطيبات — يرجى استخراج جدول المواد (BOM) من مرحلة المواصفات أولاً
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{Object.entries(groupedByParent).map(([parentId, group]) => {
				const isExpanded = expandedItems[parentId] !== false;
				const costingItem = (costingItems ?? []).find(
					(c) => c.sourceItemId === parentId,
				);

				// Calculate totals for this group
				let materialTotal = 0;
				for (const mat of group.materials) {
					const p = prices[mat.id];
					const price = p?.unitPrice ? Number(p.unitPrice) : Number(mat.unitPrice ?? 0);
					materialTotal += price * Number(mat.effectiveQuantity);
				}

				const laborP = prices[`labor_${parentId}`];
				const laborRate = laborP?.laborRate ? Number(laborP.laborRate) : 0;
				const firstMat = group.materials[0];
				const parentQty = firstMat ? Number(firstMat.quantity) / (Number(firstMat.consumptionRate) || 1) : 0;
				const laborTotal = laborRate * parentQty;

				const storageP = prices[`storage_${parentId}`];
				const storagePct = storageP?.storagePercent ? Number(storageP.storagePercent) : 2;
				const storageTotal = (materialTotal + laborTotal) * (storagePct / 100);
				const itemTotal = materialTotal + laborTotal + storageTotal;

				return (
					<div
						key={parentId}
						className="rounded-xl border border-border bg-card overflow-hidden"
					>
						{/* Parent item header */}
						<button
							type="button"
							onClick={() => toggleItem(parentId)}
							className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors"
						>
							<div className="flex items-center gap-2">
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronLeft className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="font-medium text-sm">{group.category}</span>
								<span className="text-xs text-muted-foreground">
									({group.materials.length} مادة)
								</span>
							</div>
							<span className="text-sm font-medium" dir="ltr">
								{itemTotal > 0 ? formatNum(itemTotal) + " ر.س" : "—"}
							</span>
						</button>

						{isExpanded && (
							<div className="border-t border-border">
								{/* Materials table */}
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b bg-muted/30 text-muted-foreground">
												<th className="px-3 py-2 text-right font-medium">المادة</th>
												<th className="px-3 py-2 text-center font-medium">الكمية</th>
												<th className="px-3 py-2 text-center font-medium">الوحدة</th>
												<th className="px-3 py-2 text-center font-medium">سعر الوحدة</th>
												<th className="px-3 py-2 text-center font-medium">الإجمالي</th>
											</tr>
										</thead>
										<tbody>
											{group.materials.map((mat) => {
												const p = prices[mat.id];
												const unitPrice = p?.unitPrice
													? Number(p.unitPrice)
													: Number(mat.unitPrice ?? 0);
												const total = unitPrice * Number(mat.effectiveQuantity);

												return (
													<tr
														key={mat.id}
														className="border-b last:border-0 hover:bg-muted/20"
													>
														<td className="px-3 py-2">
															<span className="font-medium">{mat.materialName}</span>
															{mat.materialNameEn && (
																<span className="text-xs text-muted-foreground mr-2">
																	({mat.materialNameEn})
																</span>
															)}
														</td>
														<td className="px-3 py-2 text-center" dir="ltr">
															{formatNum(Number(mat.effectiveQuantity))}
														</td>
														<td className="px-3 py-2 text-center">{mat.unit}</td>
														<td className="px-3 py-2">
															<Input
																type="number"
																className="h-8 w-20 mx-auto text-center rounded-lg"
																dir="ltr"
																placeholder="0"
																value={p?.unitPrice ?? (mat.unitPrice ? String(Number(mat.unitPrice)) : "")}
																onChange={(e) =>
																	setPrices((prev) => ({
																		...prev,
																		[mat.id]: {
																			...prev[mat.id],
																			unitPrice: e.target.value,
																			laborRate: prev[mat.id]?.laborRate ?? "",
																			storagePercent: prev[mat.id]?.storagePercent ?? "",
																		},
																	}))
																}
															/>
														</td>
														<td
															className="px-3 py-2 text-center font-medium"
															dir="ltr"
														>
															{total > 0 ? formatNum(total) : "—"}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Labor + Storage summary row */}
								<div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
									<div className="flex items-center gap-4 text-sm">
										<span className="text-muted-foreground w-20">إجمالي المواد:</span>
										<span className="font-medium" dir="ltr">
											{materialTotal > 0 ? formatNum(materialTotal) + " ر.س" : "—"}
										</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="text-muted-foreground w-20">المصنعية:</span>
										<div className="flex items-center gap-2">
											<Input
												type="number"
												className="h-8 w-20 text-center rounded-lg"
												dir="ltr"
												placeholder="0"
												value={prices[`labor_${parentId}`]?.laborRate ?? ""}
												onChange={(e) =>
													setPrices((prev) => ({
														...prev,
														[`labor_${parentId}`]: {
															unitPrice: "",
															laborRate: e.target.value,
															storagePercent: prev[`labor_${parentId}`]?.storagePercent ?? "",
														},
													}))
												}
											/>
											<span className="text-xs text-muted-foreground">ر.س/وحدة</span>
											{laborTotal > 0 && (
												<span className="text-sm font-medium mr-2" dir="ltr">
													= {formatNum(laborTotal)} ر.س
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="text-muted-foreground w-20">التشوين:</span>
										<div className="flex items-center gap-2">
											<Input
												type="number"
												className="h-8 w-16 text-center rounded-lg"
												dir="ltr"
												placeholder="2"
												value={prices[`storage_${parentId}`]?.storagePercent ?? ""}
												onChange={(e) =>
													setPrices((prev) => ({
														...prev,
														[`storage_${parentId}`]: {
															unitPrice: "",
															laborRate: "",
															storagePercent: e.target.value,
														},
													}))
												}
											/>
											<span className="text-xs text-muted-foreground">%</span>
											{storageTotal > 0 && (
												<span className="text-sm font-medium mr-2" dir="ltr">
													= {formatNum(storageTotal)} ر.س
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-4 text-sm border-t border-border pt-2">
										<span className="font-medium w-20">إجمالي البند:</span>
										<span className="font-bold text-primary" dir="ltr">
											{itemTotal > 0 ? formatNum(itemTotal) + " ر.س" : "—"}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
