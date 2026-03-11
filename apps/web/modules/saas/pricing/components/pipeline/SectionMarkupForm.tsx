"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SECTION_ORDER, SECTION_LABELS, SECTION_BG_COLORS } from "../../lib/costing-constants";
import { formatAmount } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SectionMarkupFormProps {
	organizationId: string;
	studyId: string;
	sectionMarkups: Array<{ section: string; markupPercent: number }>;
	profitAnalysis?: {
		sections: Array<{ section: string; cost: number; markupPercent: number; total: number }>;
	} | null;
	isLoading: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SectionMarkupForm({
	organizationId,
	studyId,
	sectionMarkups,
	profitAnalysis,
	isLoading,
}: SectionMarkupFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [markups, setMarkups] = useState<Record<string, number>>({});
	const [dirty, setDirty] = useState(false);

	// Initialize from existing data
	useEffect(() => {
		const m: Record<string, number> = {};
		for (const sm of sectionMarkups) {
			m[sm.section] = sm.markupPercent;
		}
		// Fill missing sections with 0
		for (const s of SECTION_ORDER) {
			if (m[s] == null) m[s] = 0;
		}
		setMarkups(m);
		setDirty(false);
	}, [sectionMarkups]);

	const saveMutation = useMutation(
		orpc.pricing.studies.markup.setSectionMarkups.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.markupSaved"));
				setDirty(false);
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "markup"]],
				});
			},
			onError: (e: any) => toast.error(e.message),
		}),
	);

	const handleSave = () => {
		const markupsArray = Object.entries(markups).map(([section, markupPercent]) => ({
			section,
			markupPercent,
		}));
		(saveMutation as any).mutate({
			organizationId,
			studyId,
			markups: markupsArray,
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-4">
					<Skeleton className="h-48 w-full" />
				</CardContent>
			</Card>
		);
	}

	// Build section data from profit analysis
	const sectionData = SECTION_ORDER.map((section) => {
		const pa = profitAnalysis?.sections?.find((s) => s.section === section);
		const cost = pa?.cost ?? 0;
		const markupPct = markups[section] ?? 0;
		const total = cost * (1 + markupPct / 100);
		return { section, cost, markupPct, total };
	}).filter((s) => s.cost > 0);

	const grandCost = sectionData.reduce((s, d) => s + d.cost, 0);
	const grandTotal = sectionData.reduce((s, d) => s + d.total, 0);

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">
						{t("pricing.pipeline.markupPerSection")}
					</CardTitle>
					{dirty && (
						<Button
							size="sm"
							onClick={handleSave}
							disabled={saveMutation.isPending}
							className="gap-1.5"
						>
							{saveMutation.isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Save className="h-3.5 w-3.5" />
							)}
							{t("common.save")}
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50 text-muted-foreground">
								<th className="px-3 py-2 text-right font-medium">{t("pricing.pipeline.costingSection")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.sectionCost")}</th>
								<th className="px-3 py-2 text-center font-medium w-28">{t("pricing.pipeline.markupPercentHeader")}</th>
								<th className="px-3 py-2 text-left font-medium">{t("pricing.pipeline.sectionTotal")}</th>
							</tr>
						</thead>
						<tbody>
							{sectionData.map((row) => (
								<tr
									key={row.section}
									className={`border-b border-r-4 ${SECTION_BG_COLORS[row.section] || ""}`}
								>
									<td className="px-3 py-2 font-medium">
										{SECTION_LABELS[row.section] || row.section}
									</td>
									<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
										{formatAmount(row.cost)} ر.س
									</td>
									<td className="px-3 py-1 text-center">
										<div className="relative">
											<Input
												type="number"
												value={row.markupPct}
												onChange={(e: any) => {
													setMarkups((prev) => ({
														...prev,
														[row.section]: Number(e.target.value),
													}));
													setDirty(true);
												}}
												min={0}
												max={200}
												step={0.5}
												className="h-8 text-sm text-center w-full pl-7"
												dir="ltr"
											/>
											<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
										</div>
									</td>
									<td className="px-3 py-2 tabular-nums text-left font-medium" dir="ltr">
										{formatAmount(row.total)} ر.س
									</td>
								</tr>
							))}

							{/* Grand total row */}
							<tr className="border-t-2 bg-muted/30 font-semibold">
								<td className="px-3 py-2">{t("pricing.pipeline.costingGrandTotal")}</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(grandCost)} ر.س
								</td>
								<td className="px-3 py-2" />
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{formatAmount(grandTotal)} ر.س
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
