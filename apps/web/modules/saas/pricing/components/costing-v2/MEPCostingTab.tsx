"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface MEPCostingTabProps {
	organizationId: string;
	studyId: string;
}

type PricingMode = "detailed" | "lump_sum";

interface SectionConfig {
	mode: PricingMode;
	lumpSumAmount: string;
}

interface ItemPrices {
	material: string;
	labor: string;
	storage: string;
}

const MEP_SECTIONS = [
	{ key: "ELECTRICAL", label: "أعمال الكهرباء" },
	{ key: "PLUMBING", label: "أعمال السباكة" },
	{ key: "HVAC", label: "أعمال التكييف" },
	{ key: "FIRE_FIGHTING", label: "أعمال الإطفاء" },
] as const;

export function MEPCostingTab({
	organizationId,
	studyId,
}: MEPCostingTabProps) {
	const queryClient = useQueryClient();
	const [sectionConfigs, setSectionConfigs] = useState<
		Record<string, SectionConfig>
	>({});
	const [prices, setPrices] = useState<Record<string, ItemPrices>>({});
	const [savingSections, setSavingSections] = useState<Record<string, boolean>>(
		{},
	);
	const initializedRef = useRef(false);

	// ─── Fetch MEP items (source items from quantities) ───
	const { data: mepItems, isLoading: mepLoading } = useQuery(
		orpc.pricing.studies.getMEPItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	// ─── Fetch costing items ───
	const { data: costingItems, isLoading: costingLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "MEP" },
		}),
	);

	// ─── Generate costing items mutation ───
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "costing"],
				});
			},
			onError: (e) => toast.error(e.message || "حدث خطأ في توليد البنود"),
		}),
	);

	// ─── Bulk update mutation (detailed mode) ───
	const bulkUpdateMutation = useMutation(
		orpc.pricing.studies.costing.bulkUpdate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "costing"],
				});
			},
		}),
	);

	// ─── Set section labor mutation (lump sum mode) ───
	const setSectionLaborMutation = useMutation(
		orpc.pricing.studies.costing.setSectionLabor.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "costing"],
				});
			},
		}),
	);

	// ─── Auto-generate costing items on mount if none exist ───
	const isLoading = mepLoading || costingLoading;
	useEffect(() => {
		if (
			isLoading ||
			generateMutation.isPending ||
			initializedRef.current
		) {
			return;
		}
		const hasMepItems = (mepItems ?? []).length > 0;
		const hasCostingItems = (costingItems ?? []).length > 0;
		if (hasMepItems && !hasCostingItems) {
			initializedRef.current = true;
			generateMutation.mutate({ organizationId, studyId });
		} else {
			initializedRef.current = true;
		}
	}, [isLoading, mepItems, costingItems, organizationId, studyId, generateMutation]);

	// ─── Initialize local state from fetched costing items ───
	useEffect(() => {
		if (!costingItems || costingItems.length === 0) return;

		const newPrices: Record<string, ItemPrices> = {};
		const newConfigs: Record<string, SectionConfig> = {};

		for (const item of costingItems) {
			// Detect lump-sum sections
			const category = item.section ?? "";
			if (
				item.laborType === "LUMP_SUM" &&
				category &&
				!newConfigs[category]
			) {
				newConfigs[category] = {
					mode: "lump_sum",
					lumpSumAmount: item.laborUnitCost
						? String(Number(item.laborUnitCost))
						: "",
				};
			}

			newPrices[item.id] = {
				material: item.materialUnitCost
					? String(Number(item.materialUnitCost))
					: "",
				labor: item.laborUnitCost
					? String(Number(item.laborUnitCost))
					: "",
				storage: item.storageCostPercent
					? String(Number(item.storageCostPercent))
					: "",
			};
		}

		setPrices((prev) => {
			// Only set if prices haven't been manually changed
			const hasExisting = Object.keys(prev).length > 0;
			return hasExisting ? prev : newPrices;
		});

		setSectionConfigs((prev) => {
			const hasExisting = Object.keys(prev).length > 0;
			if (hasExisting) return prev;
			// Set defaults for all sections
			const configs: Record<string, SectionConfig> = {};
			for (const section of MEP_SECTIONS) {
				configs[section.key] = newConfigs[section.key] ?? {
					mode: "detailed",
					lumpSumAmount: "",
				};
			}
			return configs;
		});
	}, [costingItems]);

	// ─── Helpers ───
	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	const getConfig = (sectionKey: string): SectionConfig =>
		sectionConfigs[sectionKey] ?? { mode: "detailed", lumpSumAmount: "" };

	const setConfig = (sectionKey: string, update: Partial<SectionConfig>) => {
		setSectionConfigs((prev) => ({
			...prev,
			[sectionKey]: { ...getConfig(sectionKey), ...update },
		}));
	};

	// ─── Group MEP items by category ───
	const grouped = useMemo(() => {
		return (mepItems ?? []).reduce(
			(acc, item) => {
				const cat = item.category ?? "عام";
				if (!acc[cat]) acc[cat] = [];
				acc[cat].push(item);
				return acc;
			},
			{} as Record<string, typeof mepItems>,
		);
	}, [mepItems]);

	// ─── Calculate section total ───
	const calcSectionTotal = (sectionKey: string): number => {
		const config = getConfig(sectionKey);
		if (config.mode === "lump_sum") {
			return config.lumpSumAmount ? Number(config.lumpSumAmount) : 0;
		}
		const sectionItems = grouped[sectionKey] ?? [];
		let total = 0;
		for (const item of sectionItems) {
			const costingItem = (costingItems ?? []).find(
				(c) => c.sourceItemId === item.id,
			);
			const itemKey = costingItem?.id ?? item.id;
			const p = prices[itemKey] ?? {};
			const qty = Number(item.quantity);
			const matPrice = p.material ? Number(p.material) : 0;
			const laborPrice = p.labor ? Number(p.labor) : 0;
			const storagePct = p.storage ? Number(p.storage) : 2;
			const matTotal = matPrice * qty;
			const laborTotal = laborPrice * qty;
			const storageTotal = (matTotal + laborTotal) * (storagePct / 100);
			total += matTotal + laborTotal + storageTotal;
		}
		return total;
	};

	// ─── Grand total across all sections ───
	const grandTotal = useMemo(() => {
		return MEP_SECTIONS.reduce(
			(sum, section) => sum + calcSectionTotal(section.key),
			0,
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sectionConfigs, prices, grouped, costingItems]);

	// ─── Save handler per section ───
	const handleSaveSection = async (sectionKey: string) => {
		const config = getConfig(sectionKey);
		setSavingSections((prev) => ({ ...prev, [sectionKey]: true }));

		try {
			if (config.mode === "lump_sum") {
				await setSectionLaborMutation.mutateAsync({
					organizationId,
					studyId,
					section: sectionKey,
					laborType: "LUMP_SUM",
					laborUnitCost: config.lumpSumAmount
						? Number(config.lumpSumAmount)
						: 0,
				});
				toast.success("تم حفظ المقطوعية بنجاح");
			} else {
				// Detailed mode: bulk update all items in this section
				const sectionItems = grouped[sectionKey] ?? [];
				const items: Array<{
					id: string;
					materialUnitCost: number;
					laborType: "PER_SQM" | "PER_CBM" | "PER_UNIT" | "PER_LM" | "LUMP_SUM" | "SALARY";
					laborUnitCost: number;
					laborQuantity: number;
				}> = [];

				for (const item of sectionItems) {
					const costingItem = (costingItems ?? []).find(
						(c) => c.sourceItemId === item.id,
					);
					if (!costingItem) continue;
					const p = prices[costingItem.id] ?? {};
					items.push({
						id: costingItem.id,
						materialUnitCost: p.material ? Number(p.material) : 0,
						laborType: "PER_UNIT" as const,
						laborUnitCost: p.labor ? Number(p.labor) : 0,
						laborQuantity: Number(item.quantity),
					});
				}

				if (items.length === 0) {
					toast.error("لا توجد بنود تسعير لهذا القسم");
					return;
				}

				await bulkUpdateMutation.mutateAsync({
					organizationId,
					studyId,
					items,
				});
				toast.success("تم حفظ الأسعار بنجاح");
			}
		} catch {
			toast.error("حدث خطأ أثناء الحفظ");
		} finally {
			setSavingSections((prev) => ({ ...prev, [sectionKey]: false }));
		}
	};

	// ─── Loading state ───
	if (isLoading || generateMutation.isPending) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if ((mepItems ?? []).length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center">
				<p className="text-muted-foreground">
					لا توجد بنود كهروميكانيكية
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{MEP_SECTIONS.map((section) => {
				const sectionItems = grouped[section.key] ?? [];
				if (
					sectionItems.length === 0 &&
					section.key !== "ELECTRICAL" &&
					section.key !== "PLUMBING"
				) {
					return null;
				}

				const config = getConfig(section.key);
				const sectionTotal = calcSectionTotal(section.key);
				const isSaving = savingSections[section.key] ?? false;

				return (
					<div
						key={section.key}
						className="rounded-xl border border-border bg-card overflow-hidden"
					>
						{/* Section header */}
						<div className="px-4 py-3 bg-muted/30 border-b border-border">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">{section.label}</h4>
								<div className="flex items-center gap-3">
									<span className="text-xs text-muted-foreground">
										{sectionItems.length} بند
									</span>
									{sectionTotal > 0 && (
										<span
											className="text-sm font-semibold text-primary"
											dir="ltr"
										>
											{formatNum(sectionTotal)} ر.س
										</span>
									)}
								</div>
							</div>
							{/* Mode selector */}
							<div className="flex gap-2 mt-2">
								<button
									type="button"
									onClick={() =>
										setConfig(section.key, { mode: "detailed" })
									}
									className={cn(
										"px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
										config.mode === "detailed"
											? "border-primary bg-primary/5 text-primary"
											: "border-border hover:border-muted-foreground/30",
									)}
								>
									تفصيلي (بند بند)
								</button>
								<button
									type="button"
									onClick={() =>
										setConfig(section.key, { mode: "lump_sum" })
									}
									className={cn(
										"px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
										config.mode === "lump_sum"
											? "border-primary bg-primary/5 text-primary"
											: "border-border hover:border-muted-foreground/30",
									)}
								>
									مقطوعية شاملة
								</button>
							</div>
						</div>

						{/* Lump sum mode */}
						{config.mode === "lump_sum" && (
							<div className="p-4 space-y-3">
								<div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
									<Label className="text-sm font-medium mb-2 block">
										{section.label} — مقاول باطن
									</Label>
									<div className="flex items-center gap-3">
										<Input
											type="number"
											className="h-10 w-40 rounded-lg"
											dir="ltr"
											placeholder="0"
											value={config.lumpSumAmount}
											onChange={(e) =>
												setConfig(section.key, {
													lumpSumAmount: e.target.value,
												})
											}
										/>
										<span className="text-sm text-muted-foreground">
											ريال (شامل مواد ومصنعية وتشوين)
										</span>
									</div>
									{sectionItems.length > 0 && (
										<p className="text-xs text-muted-foreground mt-2">
											يحتوي:{" "}
											{sectionItems.map((i) => i.name).join("، ")}
										</p>
									)}
								</div>
							</div>
						)}

						{/* Detailed mode */}
						{config.mode === "detailed" && sectionItems.length > 0 && (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/20 text-muted-foreground">
											<th className="px-3 py-2.5 text-right font-medium">
												البند
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												الكمية
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												الوحدة
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												سعر المادة
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												المصنعية
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												التشوين%
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												الإجمالي
											</th>
										</tr>
									</thead>
									<tbody>
										{sectionItems.map((item) => {
											const costingItem = (costingItems ?? []).find(
												(c) => c.sourceItemId === item.id,
											);
											const itemKey = costingItem?.id ?? item.id;
											const p = prices[itemKey] ?? {};

											const qty = Number(item.quantity);
											const matPrice = p.material
												? Number(p.material)
												: 0;
											const laborPrice = p.labor
												? Number(p.labor)
												: 0;
											const storagePct = p.storage
												? Number(p.storage)
												: 2;
											const matTotal = matPrice * qty;
											const laborTotal = laborPrice * qty;
											const storageTotal =
												(matTotal + laborTotal) * (storagePct / 100);
											const total =
												matTotal + laborTotal + storageTotal;

											return (
												<tr
													key={item.id}
													className="border-b last:border-0 hover:bg-muted/20"
												>
													<td className="px-3 py-2 font-medium">
														{item.name}
													</td>
													<td
														className="px-3 py-2 text-center"
														dir="ltr"
													>
														{formatNum(qty)}
													</td>
													<td className="px-3 py-2 text-center">
														{item.unit}
													</td>
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
																	[itemKey]: {
																		...prev[itemKey],
																		material: e.target.value,
																		labor:
																			prev[itemKey]?.labor ??
																			"",
																		storage:
																			prev[itemKey]
																				?.storage ?? "",
																	},
																}))
															}
														/>
													</td>
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
																	[itemKey]: {
																		...prev[itemKey],
																		material:
																			prev[itemKey]
																				?.material ?? "",
																		labor: e.target.value,
																		storage:
																			prev[itemKey]
																				?.storage ?? "",
																	},
																}))
															}
														/>
													</td>
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
																	[itemKey]: {
																		...prev[itemKey],
																		material:
																			prev[itemKey]
																				?.material ?? "",
																		labor:
																			prev[itemKey]?.labor ??
																			"",
																		storage: e.target.value,
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
						)}

						{config.mode === "detailed" &&
							sectionItems.length === 0 && (
								<div className="p-6 text-center text-muted-foreground text-sm">
									لا توجد بنود في هذا القسم
								</div>
							)}

						{/* Section footer: total + save button */}
						<div className="px-4 py-3 bg-muted/10 border-t border-border flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">
									إجمالي {section.label}:
								</span>
								<span
									className="font-bold text-primary"
									dir="ltr"
								>
									{sectionTotal > 0
										? formatNum(sectionTotal) + " ر.س"
										: "—"}
								</span>
							</div>
							<Button
								size="sm"
								className="gap-1.5 rounded-lg"
								disabled={isSaving}
								onClick={() => handleSaveSection(section.key)}
							>
								{isSaving ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Save className="h-3.5 w-3.5" />
								)}
								حفظ
							</Button>
						</div>
					</div>
				);
			})}

			{/* Grand total */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
				<div className="flex items-center justify-between">
					<span className="font-semibold">
						إجمالي الأعمال الكهروميكانيكية
					</span>
					<span
						className="text-xl font-bold text-primary"
						dir="ltr"
					>
						{grandTotal > 0
							? formatNum(grandTotal) + " ر.س"
							: "—"}
					</span>
				</div>
				{/* Per-section breakdown */}
				<div className="mt-3 space-y-1 border-t border-primary/20 pt-3">
					{MEP_SECTIONS.map((section) => {
						const total = calcSectionTotal(section.key);
						if (total === 0) return null;
						return (
							<div
								key={section.key}
								className="flex items-center justify-between text-sm"
							>
								<span className="text-muted-foreground">
									{section.label}
								</span>
								<span dir="ltr">
									{formatNum(total)} ر.س
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
