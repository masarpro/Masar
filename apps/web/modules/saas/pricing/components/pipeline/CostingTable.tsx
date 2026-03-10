"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { LaborCostInput } from "./LaborCostInput";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CostingItem {
	id: string;
	section: string;
	description: string;
	unit: string;
	quantity: number;
	materialUnitCost: number | null;
	materialTotal: number | null;
	laborType: string | null;
	laborUnitCost: number | null;
	laborQuantity: number | null;
	laborWorkers: number | null;
	laborSalary: number | null;
	laborMonths: number | null;
	laborTotal: number | null;
	storageCostPercent: number | null;
	storageCostFixed: number | null;
	storageTotal: number | null;
	otherCosts: number | null;
	totalCost: number | null;
}

interface CostingTableProps {
	organizationId: string;
	items: CostingItem[];
}

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة",
	MANUAL: "يدوي",
};

const SECTION_COLORS: Record<string, string> = {
	STRUCTURAL: "border-r-blue-500",
	FINISHING: "border-r-amber-500",
	MEP: "border-r-emerald-500",
	LABOR: "border-r-purple-500",
	MANUAL: "border-r-gray-500",
};

function fmt(n: number | null): string {
	if (n == null || n === 0) return "—";
	return n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CostingTable({
	organizationId,
	items,
}: CostingTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = useState<string | null>(null);

	const updateMutation = useMutation(
		orpc.pricing.studies.costing.updateItem.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
				setEditingId(null);
			},
			onError: (e) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	const handleMaterialCostChange = useCallback(
		(itemId: string, value: string) => {
			const num = value ? Number(value) : null;
			updateMutation.mutate({
				organizationId,
				itemId,
				materialUnitCost: num,
			});
		},
		[organizationId, updateMutation],
	);

	const handleLaborChange = useCallback(
		(itemId: string, data: Record<string, unknown>) => {
			updateMutation.mutate({
				organizationId,
				itemId,
				...data,
			});
		},
		[organizationId, updateMutation],
	);

	// Group items by section
	const grouped = new Map<string, CostingItem[]>();
	for (const item of items) {
		const arr = grouped.get(item.section) || [];
		arr.push(item);
		grouped.set(item.section, arr);
	}

	return (
		<div className="space-y-6" dir="rtl">
			{Array.from(grouped.entries()).map(([section, sectionItems]) => {
				const sectionTotal = sectionItems.reduce((s, i) => s + (i.totalCost ?? 0), 0);

				return (
					<div key={section} className="rounded-xl border overflow-hidden">
						{/* Section header */}
						<div className={cn(
							"flex items-center justify-between px-4 py-3 bg-muted/50 border-r-4",
							SECTION_COLORS[section] || "border-r-gray-400",
						)}>
							<h3 className="font-semibold text-sm">
								{SECTION_LABELS[section] || section}
								<span className="text-muted-foreground font-normal mr-2">
									({sectionItems.length} بند)
								</span>
							</h3>
							<span className="text-sm font-medium tabular-nums" dir="ltr">
								{fmt(sectionTotal)} ر.س
							</span>
						</div>

						{/* Table */}
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead>
									<tr className="border-b bg-muted/30 text-muted-foreground">
										<th className="px-2 py-2 text-right font-medium w-8">#</th>
										<th className="px-2 py-2 text-right font-medium min-w-[180px]">{t("pricing.pipeline.costingItem")}</th>
										<th className="px-2 py-2 text-center font-medium w-16">{t("pricing.pipeline.costingQty")}</th>
										<th className="px-2 py-2 text-center font-medium w-14">{t("pricing.pipeline.costingUnit")}</th>
										<th className="px-2 py-2 text-center font-medium w-24">{t("pricing.pipeline.costingMatPrice")}</th>
										<th className="px-2 py-2 text-center font-medium w-24">{t("pricing.pipeline.costingMatTotal")}</th>
										<th className="px-2 py-2 text-center font-medium w-40">{t("pricing.pipeline.costingLabor")}</th>
										<th className="px-2 py-2 text-center font-medium w-24">{t("pricing.pipeline.costingLaborTotal")}</th>
										<th className="px-2 py-2 text-center font-medium w-24">{t("pricing.pipeline.costingTotal")}</th>
									</tr>
								</thead>
								<tbody>
									{sectionItems.map((item, idx) => (
										<tr
											key={item.id}
											className="border-b hover:bg-accent/30 transition-colors"
										>
											<td className="px-2 py-2 text-muted-foreground">{idx + 1}</td>
											<td className="px-2 py-2 font-medium text-xs">{item.description}</td>
											<td className="px-2 py-2 text-center tabular-nums" dir="ltr">
												{item.quantity}
											</td>
											<td className="px-2 py-2 text-center text-muted-foreground">
												{item.unit}
											</td>
											{/* Material unit cost - editable */}
											<td className="px-2 py-1">
												<Input
													type="number"
													value={item.materialUnitCost ?? ""}
													onChange={() => setEditingId(item.id)}
													onBlur={(e) => handleMaterialCostChange(item.id, e.target.value)}
													className="h-7 text-xs text-center w-full"
													dir="ltr"
													placeholder="—"
												/>
											</td>
											{/* Material total */}
											<td className="px-2 py-2 text-center tabular-nums" dir="ltr">
												{fmt(item.materialTotal)}
											</td>
											{/* Labor input */}
											<td className="px-2 py-1">
												<LaborCostInput
													laborType={item.laborType as any}
													laborUnitCost={item.laborUnitCost}
													laborQuantity={item.laborQuantity}
													laborWorkers={item.laborWorkers}
													laborSalary={item.laborSalary}
													laborMonths={item.laborMonths}
													laborTotal={item.laborTotal}
													onChange={(data) => handleLaborChange(item.id, data)}
												/>
											</td>
											{/* Labor total */}
											<td className="px-2 py-2 text-center tabular-nums" dir="ltr">
												{fmt(item.laborTotal)}
											</td>
											{/* Total cost */}
											<td className="px-2 py-2 text-center tabular-nums font-medium" dir="ltr">
												{fmt(item.totalCost)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				);
			})}
		</div>
	);
}
