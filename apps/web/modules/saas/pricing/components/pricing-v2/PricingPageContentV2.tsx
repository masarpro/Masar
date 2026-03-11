"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ProfitAnalysisCard } from "./ProfitAnalysisCard";

interface PricingPageContentV2Props {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

type MarkupMethod = "uniform" | "per_section";

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

export function PricingPageContentV2({
	organizationId,
	organizationSlug,
	studyId,
}: PricingPageContentV2Props) {
	const queryClient = useQueryClient();

	// Check that COSTING stage is APPROVED
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stages = stagesData?.stages ?? [];
	const costingStage = stages.find((s) => s.stage === "COSTING");
	const isCostingApproved = costingStage?.status === "APPROVED";

	// Fetch markup settings
	const { data: markupSettings } = useQuery(
		orpc.pricing.studies.markup.getSettings.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Fetch profit analysis
	const { data: profitData, isLoading: profitLoading } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const [method, setMethod] = useState<MarkupMethod>("uniform");
	const [overheadPct, setOverheadPct] = useState("");
	const [profitPct, setProfitPct] = useState("");
	const [contingencyPct, setContingencyPct] = useState("");
	const [vatIncluded, setVatIncluded] = useState(true);
	const [sectionMarkups, setSectionMarkups] = useState<Record<string, string>>({});

	// Set uniform markup
	const uniformMutation = useMutation(
		orpc.pricing.studies.markup.setUniform.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ إعدادات الهامش");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "markup"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الحفظ");
			},
		}),
	);

	// Set section markups
	const sectionMutation = useMutation(
		orpc.pricing.studies.markup.setSectionMarkups.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ هوامش الأقسام");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "markup"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الحفظ");
			},
		}),
	);

	// Approve stage
	const approveMutation = useMutation(
		orpc.pricing.studies.studyStages.approve.mutationOptions({
			onSuccess: () => {
				toast.success("تم اعتماد مرحلة التسعير");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "studyStages"],
				});
			},
		}),
	);

	if (stagesLoading) return null;

	if (!isCostingApproved) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
				<div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
					<Lock className="h-10 w-10 text-amber-500" />
				</div>
				<h3 className="text-lg font-semibold mb-2">مرحلة التسعير مقفلة</h3>
				<p className="text-muted-foreground mb-4 max-w-md">
					يجب اعتماد مرحلة تسعير التكلفة أولاً قبل البدء في التسعير
				</p>
				<Button asChild variant="outline" className="rounded-xl">
					<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/costing`}>
						الرجوع لتسعير التكلفة
					</Link>
				</Button>
			</div>
		);
	}

	const overhead = overheadPct ? Number(overheadPct) : (markupSettings?.uniformSettings?.overheadPercent ?? 5);
	const profit = profitPct ? Number(profitPct) : (markupSettings?.uniformSettings?.profitPercent ?? 15);
	const contingency = contingencyPct ? Number(contingencyPct) : (markupSettings?.uniformSettings?.contingencyPercent ?? 2);
	const isVat = vatIncluded || (markupSettings?.uniformSettings?.vatIncluded ?? true);

	const handleSaveUniform = () => {
		uniformMutation.mutate({
			organizationId,
			studyId,
			overheadPercent: overhead,
			profitPercent: profit,
			contingencyPercent: contingency,
			vatIncluded: isVat,
		});
	};

	const handleSaveSections = () => {
		const sections = profitData?.sections ?? [];
		const markups = sections.map((s) => ({
			section: s.section,
			markupPercent: sectionMarkups[s.section]
				? Number(sectionMarkups[s.section])
				: s.markupPercent,
		}));
		sectionMutation.mutate({
			organizationId,
			studyId,
			markups,
		});
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Cost summary card (read-only) */}
			<div className="rounded-xl border border-border bg-card p-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-sm text-muted-foreground">إجمالي التكلفة (من المرحلة السابقة)</h4>
					<span className="text-lg font-bold" dir="ltr">
						{profitData
							? Number(profitData.totalCost).toLocaleString("ar-SA", { maximumFractionDigits: 2 }) + " ر.س"
							: "—"}
					</span>
				</div>
			</div>

			{/* Markup method selector */}
			<div className="rounded-xl border border-border bg-card p-4">
				<Label className="text-sm font-medium mb-3 block">طريقة الهامش</Label>
				<div className="flex gap-2 flex-wrap">
					<button
						type="button"
						onClick={() => setMethod("uniform")}
						className={cn(
							"px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
							method === "uniform"
								? "border-primary bg-primary/5 text-primary"
								: "border-border hover:border-muted-foreground/30",
						)}
					>
						نسبة موحدة
					</button>
					<button
						type="button"
						onClick={() => setMethod("per_section")}
						className={cn(
							"px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
							method === "per_section"
								? "border-primary bg-primary/5 text-primary"
								: "border-border hover:border-muted-foreground/30",
						)}
					>
						نسبة لكل قسم
					</button>
				</div>
			</div>

			{/* Uniform markup form */}
			{method === "uniform" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-4">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div className="space-y-1">
							<Label className="text-xs">مصاريف عامة (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="5"
								value={overheadPct}
								onChange={(e) => setOverheadPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">هامش الربح (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="15"
								value={profitPct}
								onChange={(e) => setProfitPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">احتياطي (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="2"
								value={contingencyPct}
								onChange={(e) => setContingencyPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">ضريبة القيمة المضافة</Label>
							<label className="flex items-center gap-2 h-9 cursor-pointer">
								<input
									type="checkbox"
									checked={vatIncluded || isVat}
									onChange={(e) => setVatIncluded(e.target.checked)}
									className="rounded"
								/>
								<span className="text-sm">تشمل (15%)</span>
							</label>
						</div>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={handleSaveUniform}
							disabled={uniformMutation.isPending}
							className="gap-2 rounded-xl"
							size="sm"
						>
							{uniformMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							حفظ الإعدادات
						</Button>
					</div>
				</div>
			)}

			{/* Per-section markup form */}
			{method === "per_section" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-muted-foreground">
									<th className="px-4 py-3 text-right font-medium">القسم</th>
									<th className="px-4 py-3 text-center font-medium">التكلفة</th>
									<th className="px-4 py-3 text-center font-medium">نسبة الهامش (%)</th>
									<th className="px-4 py-3 text-center font-medium">سعر البيع</th>
								</tr>
							</thead>
							<tbody>
								{(profitData?.sections ?? []).map((sec) => {
									const markupPct = sectionMarkups[sec.section]
										? Number(sectionMarkups[sec.section])
										: sec.markupPercent;
									const sellingPrice = sec.cost * (1 + markupPct / 100);

									return (
										<tr key={sec.section} className="border-b last:border-0 hover:bg-muted/20">
											<td className="px-4 py-3 font-medium">
												{SECTION_LABELS[sec.section] ?? sec.section}
											</td>
											<td className="px-4 py-3 text-center" dir="ltr">
												{Number(sec.cost).toLocaleString("ar-SA", { maximumFractionDigits: 2 })}
											</td>
											<td className="px-4 py-3">
												<Input
													type="number"
													className="h-8 w-20 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder="15"
													value={sectionMarkups[sec.section] ?? String(sec.markupPercent)}
													onChange={(e) =>
														setSectionMarkups((prev) => ({
															...prev,
															[sec.section]: e.target.value,
														}))
													}
												/>
											</td>
											<td className="px-4 py-3 text-center font-medium" dir="ltr">
												{Number(sellingPrice).toLocaleString("ar-SA", { maximumFractionDigits: 2 })}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="p-3 border-t border-border flex justify-end">
						<Button
							onClick={handleSaveSections}
							disabled={sectionMutation.isPending}
							className="gap-2 rounded-xl"
							size="sm"
						>
							{sectionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							حفظ الهوامش
						</Button>
					</div>
				</div>
			)}

			{/* Profit analysis */}
			{profitLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : profitData ? (
				<ProfitAnalysisCard data={profitData} />
			) : null}

			{/* Approve */}
			<div className="flex gap-3 justify-end">
				<Button
					onClick={() =>
						approveMutation.mutate({
							organizationId,
							studyId,
							stage: "PRICING",
						})
					}
					disabled={approveMutation.isPending}
					className="gap-2 rounded-xl"
				>
					{approveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<CheckCircle2 className="h-4 w-4" />
					)}
					اعتماد التسعير
				</Button>
				<Button asChild variant="outline" className="rounded-xl">
					<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/quotation`}>
						عرض السعر →
					</Link>
				</Button>
			</div>
		</div>
	);
}
