"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	CheckCircle2,
	Loader2,
	Package,
	HardHat,
	Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { formatNum } from "@saas/pricing/lib/utils";

interface CostingSummaryTabProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	buildingArea: number;
}

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

const SECTION_DOT_COLORS: Record<string, string> = {
	STRUCTURAL: "bg-chart-4",
	FINISHING: "bg-green-500",
	MEP: "bg-orange-500",
	LABOR: "bg-purple-500",
	MANUAL: "bg-gray-500",
};

export function CostingSummaryTab({
	organizationId,
	organizationSlug,
	studyId,
	buildingArea,
}: CostingSummaryTabProps) {
	const t = useTranslations("pricing.costingV2");
	const queryClient = useQueryClient();

	// Fetch costing summary
	const { data: summary, isLoading } = useQuery(
		orpc.pricing.studies.costing.getSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Approve stage mutation
	const approveMutation = useMutation(
		orpc.pricing.studies.studyStages.approve.mutationOptions({
			onSuccess: () => {
				toast.success("تم اعتماد مرحلة تسعير التكلفة");
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.studies.studyStages.key(),
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الاعتماد");
			},
		}),
	);

	// Derived calculations
	const sections = useMemo(() => (summary as any)?.sections ?? [], [summary]);
	// الـAPI يعيد grandTotal بمفاتيح material/labor (وليس materialTotal/laborTotal)
	const grandMaterial = (summary as any)?.grandTotal?.material ?? 0;
	const grandLabor = (summary as any)?.grandTotal?.labor ?? 0;
	// التشوين والمصاريف الأخرى جزء من التكلفة — إغفالها كان يجعل البطاقات
	// وصف الإجمالي أقل من مجموع عمود "الإجمالي" لكل قسم
	const grandStorage = (summary as any)?.grandTotal?.storage ?? 0;
	const grandOther = (summary as any)?.grandTotal?.other ?? 0;
	const grandTotalAll = (summary as any)?.grandTotal?.total ?? 0;

	// Extract STRUCTURAL section to match المواد and المصنعيات tabs exactly
	const structuralSection = useMemo(
		() => sections.find((s: any) => s.section === "STRUCTURAL"),
		[sections],
	);
	const structuralMaterial = structuralSection?.materialTotal ?? 0;
	const structuralLabor = structuralSection?.laborTotal ?? 0;

	// Material vs labor percentages (structural only)
	const materialPlusLabor = structuralMaterial + structuralLabor;
	const materialPct =
		materialPlusLabor > 0 ? (structuralMaterial / materialPlusLabor) * 100 : 0;
	const laborPct =
		materialPlusLabor > 0 ? (structuralLabor / materialPlusLabor) * 100 : 0;

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4" dir="rtl">
			{/* ─── 3 Summary Cards: Materials | Labor | Total ─── */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
				{/* Materials card */}
				<div className="rounded-xl border border-border bg-card p-3 sm:p-4">
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<Package className="h-4 w-4 text-chart-4" />
						<span className="text-xs sm:text-sm font-medium">المواد</span>
					</div>
					<p className="text-base sm:text-xl font-bold" dir="ltr">
						{formatNum(structuralMaterial)} <span className="text-xs sm:text-sm font-normal text-muted-foreground">ر.س</span>
					</p>
				</div>

				{/* Labor card */}
				<div className="rounded-xl border border-border bg-card p-3 sm:p-4">
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<HardHat className="h-4 w-4 text-amber-500" />
						<span className="text-xs sm:text-sm font-medium">المصنعيات</span>
					</div>
					<p className="text-base sm:text-xl font-bold" dir="ltr">
						{formatNum(structuralLabor)} <span className="text-xs sm:text-sm font-normal text-muted-foreground">ر.س</span>
					</p>
				</div>

				{/* Grand total card — يشمل التشوين والمصاريف الأخرى (sec.total) */}
				<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 sm:p-4">
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<Wallet className="h-4 w-4 text-primary" />
						<span className="text-xs sm:text-sm font-medium">التكلفة الإجمالية</span>
					</div>
					<p className="text-base sm:text-xl font-bold text-primary" dir="ltr">
						{formatNum(structuralSection?.total ?? 0)} <span className="text-xs sm:text-sm font-normal">ر.س</span>
					</p>
				</div>
			</div>

			{/* ─── Distribution bar: Materials vs Labor ─── */}
			{(structuralMaterial + structuralLabor) > 0 && (
				<div className="rounded-xl border border-border bg-card p-4">
					<h4 className="text-sm font-semibold mb-3">توزيع التكلفة</h4>
					{/* Segmented bar */}
					<div className="h-6 rounded-full overflow-hidden flex" dir="ltr">
						{materialPct > 0 && (
							<div
								className="bg-chart-4 relative transition-all duration-500"
								style={{ width: `${materialPct}%` }}
							>
								{materialPct > 12 && (
									<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
										{Math.round(materialPct)}%
									</span>
								)}
							</div>
						)}
						{laborPct > 0 && (
							<div
								className="bg-amber-500 relative transition-all duration-500"
								style={{ width: `${laborPct}%` }}
							>
								{laborPct > 12 && (
									<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
										{Math.round(laborPct)}%
									</span>
								)}
							</div>
						)}
					</div>
					{/* Legend */}
					<div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
						<div className="flex items-center gap-1.5 text-xs">
							<span className="inline-block w-2.5 h-2.5 rounded-full bg-chart-4" />
							<span>المواد</span>
							<span className="text-muted-foreground" dir="ltr">
								({formatNum(materialPct)}%)
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs">
							<span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
							<span>المصنعيات</span>
							<span className="text-muted-foreground" dir="ltr">
								({formatNum(laborPct)}%)
							</span>
						</div>
					</div>
				</div>
			)}

			{/* ─── Summary table ─── */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border">
					<h4 className="font-semibold">ملخص تسعير التكلفة</h4>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/20">
							<TableHead className="text-start font-medium">
								القسم
							</TableHead>
							<TableHead className="text-center font-medium">
								المواد
							</TableHead>
							<TableHead className="text-center font-medium">
								المصنعيات
							</TableHead>
							<TableHead className="text-center font-medium">
								الإجمالي
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sections.map((sec: any) => (
							<TableRow
								key={sec.section}
								className="hover:bg-muted/20"
							>
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										<span
											className={`inline-block w-2.5 h-2.5 rounded-full ${SECTION_DOT_COLORS[sec.section] ?? "bg-gray-400"}`}
										/>
										{SECTION_LABELS[sec.section] ??
											sec.section}
									</div>
								</TableCell>
								<TableCell
									className="text-center"
									dir="ltr"
								>
									{formatNum(sec.materialTotal)}
								</TableCell>
								<TableCell
									className="text-center"
									dir="ltr"
								>
									{formatNum(sec.laborTotal)}
								</TableCell>
								<TableCell
									className="text-center font-medium"
									dir="ltr"
								>
									{formatNum(sec.total)}
								</TableCell>
							</TableRow>
						))}
						{/* سطر التشوين والمصاريف الأخرى — يفسّر الفارق بين مواد+مصنعيات والإجمالي */}
						{grandStorage + grandOther > 0 && (
							<TableRow className="text-muted-foreground hover:bg-muted/20">
								<TableCell className="font-medium">
									{t("summary.storageAndOther")}
								</TableCell>
								<TableCell className="text-center">—</TableCell>
								<TableCell className="text-center">—</TableCell>
								<TableCell className="text-center" dir="ltr">
									{formatNum(grandStorage + grandOther)}
								</TableCell>
							</TableRow>
						)}
						{/* Grand total row — الإجمالي يشمل التشوين والمصاريف الأخرى */}
						<TableRow className="bg-primary/10 font-bold border-t-2 border-primary/20">
							<TableCell className="text-base">الإجمالي</TableCell>
							<TableCell className="text-center text-base" dir="ltr">
								{formatNum(grandMaterial)}
							</TableCell>
							<TableCell className="text-center text-base" dir="ltr">
								{formatNum(grandLabor)}
							</TableCell>
							<TableCell className="text-center text-base" dir="ltr">
								{formatNum(grandTotalAll)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
				{/* Total cost highlight — إجمالي كل الأقسام شاملاً التشوين والمصاريف الأخرى */}
				<div className="px-4 py-4 border-t border-border bg-muted/20 text-center">
					<span className="text-sm text-muted-foreground">التكلفة الإجمالية: </span>
					<span className="text-2xl font-bold text-primary" dir="ltr">
						{formatNum(grandTotalAll)} ر.س
					</span>
				</div>
			</div>

			{/* Action button — full-width prominent */}
			<Button
				onClick={() =>
					(approveMutation as any).mutate(
						{
							organizationId,
							studyId,
							stage: "COSTING",
						},
						{
							onSuccess: () => {
								window.location.href = `/app/${organizationSlug}/pricing/studies/${studyId}/pricing`;
							},
						},
					)
				}
				/* البوابة على إجمالي كل الأقسام (شاملاً التشوين/الأخرى) — الاقتصار على الإنشائي كان يقفل اعتماد دراسات التشطيبات/MEP فقط */
				disabled={approveMutation.isPending || grandTotalAll === 0}
				className="w-full gap-2 py-4 sm:py-6 text-sm sm:text-base rounded-xl"
				size="lg"
			>
				{approveMutation.isPending ? (
					<Loader2 className="h-5 w-5 animate-spin" />
				) : (
					<CheckCircle2 className="h-5 w-5" />
				)}
				اعتماد أسعار التكلفة والانتقال إلى التسعير
			</Button>
		</div>
	);
}
