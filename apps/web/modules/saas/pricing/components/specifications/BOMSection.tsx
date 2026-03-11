"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	ChevronDown,
	ChevronLeft,
	Loader2,
	Package,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface BOMSectionProps {
	organizationId: string;
	studyId: string;
}

export function BOMSection({ organizationId, studyId }: BOMSectionProps) {
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(true);

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
					{/* Generate / Refresh button */}
					<div className="flex justify-end">
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

					{!isLoading && hasEntries && (
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
				</div>
			)}
		</div>
	);
}
