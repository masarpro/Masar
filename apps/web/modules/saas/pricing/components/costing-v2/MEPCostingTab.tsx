"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface MEPCostingTabProps {
	organizationId: string;
	studyId: string;
}

type PricingMode = "detailed" | "lump_sum";

interface SectionConfig {
	mode: PricingMode;
	lumpSumAmount: string;
}

const MEP_SECTIONS = [
	{ key: "ELECTRICAL", label: "أعمال الكهرباء" },
	{ key: "PLUMBING", label: "أعمال السباكة" },
	{ key: "HVAC", label: "أعمال التكييف" },
	{ key: "FIRE_FIGHTING", label: "أعمال الإطفاء" },
];

export function MEPCostingTab({
	organizationId,
	studyId,
}: MEPCostingTabProps) {
	const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>({});
	const [prices, setPrices] = useState<Record<string, { material: string; labor: string; storage: string }>>({});

	// Fetch MEP items
	const { data: mepItems, isLoading } = useQuery(
		orpc.pricing.studies.getMEPItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	// Fetch costing items
	const { data: costingItems } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "MEP" },
		}),
	);

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

	// Group MEP items by category
	const grouped = (mepItems ?? []).reduce(
		(acc, item) => {
			const cat = item.category ?? "عام";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(item);
			return acc;
		},
		{} as Record<string, typeof mepItems>,
	);

	if (isLoading) {
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
				if (sectionItems.length === 0 && section.key !== "ELECTRICAL" && section.key !== "PLUMBING") {
					return null;
				}

				const config = getConfig(section.key);

				return (
					<div
						key={section.key}
						className="rounded-xl border border-border bg-card overflow-hidden"
					>
						{/* Section header */}
						<div className="px-4 py-3 bg-muted/30 border-b border-border">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">{section.label}</h4>
								<span className="text-xs text-muted-foreground">
									{sectionItems.length} بند
								</span>
							</div>
							{/* Mode selector */}
							<div className="flex gap-2 mt-2">
								<button
									type="button"
									onClick={() => setConfig(section.key, { mode: "detailed" })}
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
									onClick={() => setConfig(section.key, { mode: "lump_sum" })}
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
												setConfig(section.key, { lumpSumAmount: e.target.value })
											}
										/>
										<span className="text-sm text-muted-foreground">
											ريال (شامل مواد ومصنعية وتشوين)
										</span>
									</div>
									{sectionItems.length > 0 && (
										<p className="text-xs text-muted-foreground mt-2">
											يحتوي: {sectionItems.map((i) => i.name).join("، ")}
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
											<th className="px-3 py-2.5 text-right font-medium">البند</th>
											<th className="px-3 py-2.5 text-center font-medium">الكمية</th>
											<th className="px-3 py-2.5 text-center font-medium">الوحدة</th>
											<th className="px-3 py-2.5 text-center font-medium">سعر المادة</th>
											<th className="px-3 py-2.5 text-center font-medium">المصنعية</th>
											<th className="px-3 py-2.5 text-center font-medium">التشوين%</th>
											<th className="px-3 py-2.5 text-center font-medium">الإجمالي</th>
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
											const matPrice = p.material ? Number(p.material) : 0;
											const laborPrice = p.labor ? Number(p.labor) : 0;
											const storagePct = p.storage ? Number(p.storage) : 2;
											const matTotal = matPrice * qty;
											const laborTotal = laborPrice * qty;
											const storageTotal = (matTotal + laborTotal) * (storagePct / 100);
											const total = matTotal + laborTotal + storageTotal;

											return (
												<tr
													key={item.id}
													className="border-b last:border-0 hover:bg-muted/20"
												>
													<td className="px-3 py-2 font-medium">{item.name}</td>
													<td className="px-3 py-2 text-center" dir="ltr">
														{formatNum(qty)}
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
																	[itemKey]: { ...prev[itemKey], material: e.target.value },
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
																	[itemKey]: { ...prev[itemKey], labor: e.target.value },
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
																	[itemKey]: { ...prev[itemKey], storage: e.target.value },
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

						{config.mode === "detailed" && sectionItems.length === 0 && (
							<div className="p-6 text-center text-muted-foreground text-sm">
								لا توجد بنود في هذا القسم
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
