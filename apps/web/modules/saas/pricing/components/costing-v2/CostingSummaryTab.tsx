"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	CheckCircle2,
	Loader2,
	Package,
	HardHat,
	BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
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

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
	STRUCTURAL: { bg: "bg-blue-500", text: "text-blue-600" },
	FINISHING: { bg: "bg-green-500", text: "text-green-600" },
	MEP: { bg: "bg-orange-500", text: "text-orange-600" },
	LABOR: { bg: "bg-purple-500", text: "text-purple-600" },
	MANUAL: { bg: "bg-gray-500", text: "text-gray-600" },
};

const SECTION_DOT_COLORS: Record<string, string> = {
	STRUCTURAL: "bg-blue-500",
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
	const queryClient = useQueryClient();
	const [overheadPct, setOverheadPct] = useState("");
	const [adminPct, setAdminPct] = useState("");
	const [contingencyPct, setContingencyPct] = useState("");

	// Debounce timers for saving percentages
	const overheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const adminTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const contingencyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	// TODO: Persist overhead/admin/contingency percentages to CostStudy model.
	// A dedicated mutation (e.g. orpc.pricing.studies.costing.updateOverheads)
	// should be created on the backend. For now, the values are calculated locally
	// and the save function below is a no-op placeholder.
	const savePercentages = useCallback(
		(_field: "overhead" | "admin" | "contingency", _value: number) => {
			// TODO: call mutation to persist to CostStudy, e.g.:
			// updateOverheadsMutation.mutate({ organizationId, studyId, [field]: value });
		},
		[],
	);

	const handleOverheadChange = useCallback(
		(value: string) => {
			setOverheadPct(value);
			if (overheadTimer.current) clearTimeout(overheadTimer.current);
			overheadTimer.current = setTimeout(() => {
				if (value) savePercentages("overhead", Number(value));
			}, 800);
		},
		[savePercentages],
	);

	const handleAdminChange = useCallback(
		(value: string) => {
			setAdminPct(value);
			if (adminTimer.current) clearTimeout(adminTimer.current);
			adminTimer.current = setTimeout(() => {
				if (value) savePercentages("admin", Number(value));
			}, 800);
		},
		[savePercentages],
	);

	const handleContingencyChange = useCallback(
		(value: string) => {
			setContingencyPct(value);
			if (contingencyTimer.current) clearTimeout(contingencyTimer.current);
			contingencyTimer.current = setTimeout(() => {
				if (value) savePercentages("contingency", Number(value));
			}, 800);
		},
		[savePercentages],
	);

	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	// Derived calculations
	const sections = useMemo(() => (summary as any)?.sections ?? [], [summary]);
	const grandTotal = (summary as any)?.grandTotal?.total ?? 0;
	const grandMaterial = (summary as any)?.grandTotal?.material ?? 0;
	const grandLabor = (summary as any)?.grandTotal?.labor ?? 0;
	const grandStorage = (summary as any)?.grandTotal?.storage ?? 0;

	const overhead = overheadPct
		? Number(overheadPct)
		: ((summary as any)?.overheadPercent ?? 5);
	const admin = adminPct ? Number(adminPct) : 3;
	const contingency = contingencyPct ? Number(contingencyPct) : 2;

	const overheadAmount = grandTotal * (overhead / 100);
	const adminAmount = grandTotal * (admin / 100);
	const contingencyAmount = grandTotal * (contingency / 100);
	const totalCost = grandTotal + overheadAmount + adminAmount + contingencyAmount;
	const costPerSqm = buildingArea > 0 ? totalCost / buildingArea : 0;

	// Material vs labor percentages
	const materialPlusLabor = grandMaterial + grandLabor;
	const materialPct =
		materialPlusLabor > 0 ? (grandMaterial / materialPlusLabor) * 100 : 0;
	const laborPct =
		materialPlusLabor > 0 ? (grandLabor / materialPlusLabor) * 100 : 0;

	// Section percentage composition
	const sectionPercentages = useMemo(() => {
		if (grandTotal === 0) return {};
		const result: Record<string, number> = {};
		for (const sec of sections) {
			result[sec.section] = ((sec.total ?? 0) / grandTotal) * 100;
		}
		return result;
	}, [sections, grandTotal]);

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Hero: Cost per sqm */}
			{buildingArea > 0 && (
				<div className="rounded-xl border-2 border-primary/30 bg-gradient-to-l from-primary/5 to-primary/10 p-6 text-center">
					<p className="text-sm text-muted-foreground mb-1">
						تكلفة المتر المربع
					</p>
					<p className="text-4xl font-bold text-primary" dir="ltr">
						{formatNum(costPerSqm)}{" "}
						<span className="text-lg font-medium">ر.س/م²</span>
					</p>
					<p className="text-xs text-muted-foreground mt-2">
						المساحة: {formatNum(buildingArea)} م² | الإجمالي:{" "}
						<span dir="ltr">{formatNum(totalCost)} ر.س</span>
					</p>
				</div>
			)}

			{/* Material vs Labor breakdown */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="rounded-xl border border-border bg-card p-4">
					<div className="flex items-center gap-2 mb-2">
						<Package className="h-4 w-4 text-blue-500" />
						<span className="text-sm font-medium">المواد</span>
					</div>
					<p className="text-lg font-bold" dir="ltr">
						{formatNum(grandMaterial)} ر.س
					</p>
					<div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
						<div
							className="h-full rounded-full bg-blue-500 transition-all duration-500"
							style={{ width: `${materialPct}%` }}
						/>
					</div>
					<p className="text-xs text-muted-foreground mt-1" dir="ltr">
						{formatNum(materialPct)}% من (مواد + مصنعيات)
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-4">
					<div className="flex items-center gap-2 mb-2">
						<HardHat className="h-4 w-4 text-amber-500" />
						<span className="text-sm font-medium">المصنعيات</span>
					</div>
					<p className="text-lg font-bold" dir="ltr">
						{formatNum(grandLabor)} ر.س
					</p>
					<div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
						<div
							className="h-full rounded-full bg-amber-500 transition-all duration-500"
							style={{ width: `${laborPct}%` }}
						/>
					</div>
					<p className="text-xs text-muted-foreground mt-1" dir="ltr">
						{formatNum(laborPct)}% من (مواد + مصنعيات)
					</p>
				</div>
			</div>

			{/* Visual cost distribution bar */}
			{grandTotal > 0 && (
				<div className="rounded-xl border border-border bg-card p-4">
					<div className="flex items-center gap-2 mb-3">
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
						<h4 className="text-sm font-semibold">توزيع التكلفة</h4>
					</div>
					{/* Segmented bar */}
					<div className="h-6 rounded-full overflow-hidden flex" dir="ltr">
						{sections.map((sec: any) => {
							const pct = sectionPercentages[sec.section] ?? 0;
							if (pct <= 0) return null;
							const color =
								SECTION_COLORS[sec.section]?.bg ?? "bg-gray-400";
							return (
								<div
									key={sec.section}
									className={`${color} relative group transition-all duration-500`}
									style={{ width: `${pct}%` }}
									title={`${SECTION_LABELS[sec.section] ?? sec.section}: ${formatNum(pct)}%`}
								>
									{pct > 8 && (
										<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
											{Math.round(pct)}%
										</span>
									)}
								</div>
							);
						})}
					</div>
					{/* Legend */}
					<div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
						{sections.map((sec: any) => {
							const pct = sectionPercentages[sec.section] ?? 0;
							if (pct <= 0) return null;
							const dotColor =
								SECTION_DOT_COLORS[sec.section] ?? "bg-gray-400";
							return (
								<div
									key={sec.section}
									className="flex items-center gap-1.5 text-xs"
								>
									<span
										className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`}
									/>
									<span>
										{SECTION_LABELS[sec.section] ?? sec.section}
									</span>
									<span className="text-muted-foreground" dir="ltr">
										({formatNum(pct)}%)
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Summary table */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border">
					<h4 className="font-semibold">ملخص تسعير التكلفة</h4>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/20 text-muted-foreground">
								<th className="px-4 py-3 text-right font-medium">
									القسم
								</th>
								<th className="px-4 py-3 text-center font-medium">
									المواد
								</th>
								<th className="px-4 py-3 text-center font-medium">
									المصنعيات
								</th>
								<th className="px-4 py-3 text-center font-medium">
									التشوين
								</th>
								<th className="px-4 py-3 text-center font-medium">
									الإجمالي
								</th>
								{buildingArea > 0 && (
									<th className="px-4 py-3 text-center font-medium">
										م² / ر.س
									</th>
								)}
								<th className="px-4 py-3 text-center font-medium">
									النسبة %
								</th>
							</tr>
						</thead>
						<tbody>
							{sections.map((sec: any) => {
								const pct = sectionPercentages[sec.section] ?? 0;
								const perSqm =
									buildingArea > 0
										? (sec.total ?? 0) / buildingArea
										: 0;
								const color =
									SECTION_COLORS[sec.section]?.text ??
									"text-gray-600";
								return (
									<tr
										key={sec.section}
										className="border-b last:border-0 hover:bg-muted/20"
									>
										<td className="px-4 py-3 font-medium">
											<div className="flex items-center gap-2">
												<span
													className={`inline-block w-2 h-2 rounded-full ${SECTION_DOT_COLORS[sec.section] ?? "bg-gray-400"}`}
												/>
												{SECTION_LABELS[sec.section] ??
													sec.section}
											</div>
										</td>
										<td
											className="px-4 py-3 text-center"
											dir="ltr"
										>
											{formatNum(sec.materialTotal)}
										</td>
										<td
											className="px-4 py-3 text-center"
											dir="ltr"
										>
											{formatNum(sec.laborTotal)}
										</td>
										<td
											className="px-4 py-3 text-center"
											dir="ltr"
										>
											{formatNum(sec.storageTotal)}
										</td>
										<td
											className="px-4 py-3 text-center font-medium"
											dir="ltr"
										>
											{formatNum(sec.total)}
										</td>
										{buildingArea > 0 && (
											<td
												className="px-4 py-3 text-center text-muted-foreground"
												dir="ltr"
											>
												{formatNum(perSqm)}
											</td>
										)}
										<td className="px-4 py-3 text-center">
											<div className="flex items-center justify-center gap-1.5">
												<div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
													<div
														className={`h-full rounded-full ${SECTION_COLORS[sec.section]?.bg ?? "bg-gray-400"} transition-all duration-500`}
														style={{
															width: `${Math.min(pct, 100)}%`,
														}}
													/>
												</div>
												<span
													className={`text-xs font-medium ${color}`}
													dir="ltr"
												>
													{formatNum(pct)}%
												</span>
											</div>
										</td>
									</tr>
								);
							})}
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
								{buildingArea > 0 && (
									<td
										className="px-4 py-3 text-center"
										dir="ltr"
									>
										{formatNum(
											grandTotal / buildingArea,
										)}
									</td>
								)}
								<td className="px-4 py-3 text-center text-xs font-medium">
									100%
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Overhead / Admin / Contingency */}
			<div className="rounded-xl border border-border bg-card p-4 space-y-3">
				<h4 className="font-medium text-sm mb-2">مصاريف إضافية</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">مصاريف عامة (%)</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								className="h-9 w-20 rounded-lg"
								dir="ltr"
								placeholder="5"
								value={overheadPct}
								onChange={(e: any) =>
									handleOverheadChange(e.target.value)
								}
								onBlur={() => {
									if (overheadPct)
										savePercentages(
											"overhead",
											Number(overheadPct),
										);
								}}
							/>
							<span
								className="text-sm text-muted-foreground"
								dir="ltr"
							>
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
								onChange={(e: any) =>
									handleAdminChange(e.target.value)
								}
								onBlur={() => {
									if (adminPct)
										savePercentages(
											"admin",
											Number(adminPct),
										);
								}}
							/>
							<span
								className="text-sm text-muted-foreground"
								dir="ltr"
							>
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
								onChange={(e: any) =>
									handleContingencyChange(e.target.value)
								}
								onBlur={() => {
									if (contingencyPct)
										savePercentages(
											"contingency",
											Number(contingencyPct),
										);
								}}
							/>
							<span
								className="text-sm text-muted-foreground"
								dir="ltr"
							>
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
						<span
							className="text-xl font-bold text-primary"
							dir="ltr"
						>
							{formatNum(totalCost)} ر.س
						</span>
					</div>
					{buildingArea > 0 && (
						<div className="flex items-center justify-between mt-1">
							<span className="text-sm text-muted-foreground">
								تكلفة المتر المربع
							</span>
							<span
								className="text-sm font-medium"
								dir="ltr"
							>
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
						(approveMutation as any).mutate({
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
						التسعير
					</Link>
				</Button>
			</div>
		</div>
	);
}
