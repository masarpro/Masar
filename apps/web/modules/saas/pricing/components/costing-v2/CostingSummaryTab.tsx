"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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

export function CostingSummaryTab({
	organizationId,
	organizationSlug,
	studyId,
	buildingArea,
}: CostingSummaryTabProps) {
	const queryClient = useQueryClient();
	const [overheadPct, setOverheadPct] = useState("");
	const [adminPct, setAdminPct] = useState("");
	const [contingencyPct, setContingencyPct] = useState("");

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
					queryKey: ["pricing", "studies", "studyStages"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الاعتماد");
			},
		}),
	);

	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const sections = summary?.sections ?? [];
	const grandTotal = summary?.grandTotal?.total ?? 0;
	const grandMaterial = summary?.grandTotal?.material ?? 0;
	const grandLabor = summary?.grandTotal?.labor ?? 0;
	const grandStorage = summary?.grandTotal?.storage ?? 0;

	const overhead = overheadPct ? Number(overheadPct) : (summary?.overheadPercent ?? 5);
	const admin = adminPct ? Number(adminPct) : 3;
	const contingency = contingencyPct ? Number(contingencyPct) : 2;

	const overheadAmount = grandTotal * (overhead / 100);
	const adminAmount = grandTotal * (admin / 100);
	const contingencyAmount = grandTotal * (contingency / 100);
	const totalCost = grandTotal + overheadAmount + adminAmount + contingencyAmount;
	const costPerSqm = buildingArea > 0 ? totalCost / buildingArea : 0;

	return (
		<div className="space-y-4">
			{/* Summary table */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border">
					<h4 className="font-semibold">ملخص تسعير التكلفة</h4>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/20 text-muted-foreground">
								<th className="px-4 py-3 text-right font-medium">القسم</th>
								<th className="px-4 py-3 text-center font-medium">المواد</th>
								<th className="px-4 py-3 text-center font-medium">المصنعيات</th>
								<th className="px-4 py-3 text-center font-medium">التشوين</th>
								<th className="px-4 py-3 text-center font-medium">الإجمالي</th>
							</tr>
						</thead>
						<tbody>
							{sections.map((sec) => (
								<tr
									key={sec.section}
									className="border-b last:border-0 hover:bg-muted/20"
								>
									<td className="px-4 py-3 font-medium">
										{SECTION_LABELS[sec.section] ?? sec.section}
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										{formatNum(sec.materialTotal)}
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										{formatNum(sec.laborTotal)}
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										{formatNum(sec.storageTotal)}
									</td>
									<td className="px-4 py-3 text-center font-medium" dir="ltr">
										{formatNum(sec.total)}
									</td>
								</tr>
							))}
							{/* Grand total row */}
							<tr className="bg-muted/40 font-semibold">
								<td className="px-4 py-3">الإجمالي</td>
								<td className="px-4 py-3 text-center" dir="ltr">
									{formatNum(grandMaterial)}
								</td>
								<td className="px-4 py-3 text-center" dir="ltr">
									{formatNum(grandLabor)}
								</td>
								<td className="px-4 py-3 text-center" dir="ltr">
									{formatNum(grandStorage)}
								</td>
								<td className="px-4 py-3 text-center" dir="ltr">
									{formatNum(grandTotal)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Overhead / Admin / Contingency */}
			<div className="rounded-xl border border-border bg-card p-4 space-y-3">
				<h4 className="font-medium text-sm mb-2">مصاريف إضافية</h4>
				<div className="grid grid-cols-3 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">مصاريف عامة (%)</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								className="h-9 w-20 rounded-lg"
								dir="ltr"
								placeholder="5"
								value={overheadPct}
								onChange={(e) => setOverheadPct(e.target.value)}
							/>
							<span className="text-sm text-muted-foreground" dir="ltr">
								= {formatNum(overheadAmount)} ر.س
							</span>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">مصاريف إدارية (%)</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								className="h-9 w-20 rounded-lg"
								dir="ltr"
								placeholder="3"
								value={adminPct}
								onChange={(e) => setAdminPct(e.target.value)}
							/>
							<span className="text-sm text-muted-foreground" dir="ltr">
								= {formatNum(adminAmount)} ر.س
							</span>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">احتياطي (%)</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								className="h-9 w-20 rounded-lg"
								dir="ltr"
								placeholder="2"
								value={contingencyPct}
								onChange={(e) => setContingencyPct(e.target.value)}
							/>
							<span className="text-sm text-muted-foreground" dir="ltr">
								= {formatNum(contingencyAmount)} ر.س
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Final totals */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">إجمالي البنود</span>
					<span dir="ltr">{formatNum(grandTotal)} ر.س</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						+ مصاريف عامة ({overhead}%)
					</span>
					<span dir="ltr">{formatNum(overheadAmount)} ر.س</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						+ مصاريف إدارية ({admin}%)
					</span>
					<span dir="ltr">{formatNum(adminAmount)} ر.س</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						+ احتياطي ({contingency}%)
					</span>
					<span dir="ltr">{formatNum(contingencyAmount)} ر.س</span>
				</div>
				<div className="border-t border-primary/20 pt-3">
					<div className="flex items-center justify-between">
						<span className="font-semibold">إجمالي التكلفة</span>
						<span className="text-xl font-bold text-primary" dir="ltr">
							{formatNum(totalCost)} ر.س
						</span>
					</div>
					{buildingArea > 0 && (
						<div className="flex items-center justify-between mt-1">
							<span className="text-sm text-muted-foreground">تكلفة المتر المربع</span>
							<span className="text-sm font-medium" dir="ltr">
								{formatNum(costPerSqm)} ر.س/م²
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex gap-3 justify-end">
				<Button
					onClick={() =>
						approveMutation.mutate({
							organizationId,
							studyId,
							stage: "COSTING",
						})
					}
					disabled={approveMutation.isPending || grandTotal === 0}
					className="gap-2 rounded-xl"
				>
					{approveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<CheckCircle2 className="h-4 w-4" />
					)}
					اعتماد تسعير التكلفة
				</Button>
				<Button asChild variant="outline" className="rounded-xl">
					<Link
						href={`/app/${organizationSlug}/pricing/studies/${studyId}/pricing`}
					>
						التسعير →
					</Link>
				</Button>
			</div>
		</div>
	);
}
