"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	ChevronDown,
	ChevronLeft,
	Loader2,
	Plus,
	Save,
	Trash2,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface LaborOverviewTabProps {
	organizationId: string;
	studyId: string;
}

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

interface SalaryWorker {
	id: string;
	craft: string;
	count: number;
	salary: number;
	months: number;
	insurance: number;
	housing: number;
}

const DEFAULT_WORKERS: SalaryWorker[] = [
	{ id: "1", craft: "مشرف", count: 1, salary: 5000, months: 6, insurance: 500, housing: 1500 },
	{ id: "2", craft: "عامل", count: 4, salary: 2000, months: 6, insurance: 300, housing: 800 },
];

export function LaborOverviewTab({
	organizationId,
	studyId,
}: LaborOverviewTabProps) {
	const queryClient = useQueryClient();
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		STRUCTURAL: true,
		FINISHING: true,
		MEP: true,
	});
	const [workers, setWorkers] = useState<SalaryWorker[]>(DEFAULT_WORKERS);

	// Fetch all costing items to extract labor data
	const { data: costingItems, isLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	// Group costing items by section and filter those with labor costs
	const grouped = useMemo(() => {
		return (costingItems ?? []).reduce(
			(acc, item) => {
				const section = item.section;
				if (!acc[section]) acc[section] = [];
				acc[section].push(item);
				return acc;
			},
			{} as Record<string, typeof costingItems>,
		);
	}, [costingItems]);

	// Calculate section totals
	const { sectionTotals, grandLaborTotal } = useMemo(() => {
		const totals: Array<{
			section: string;
			label: string;
			laborTotal: number;
			items: Array<{
				description: string;
				laborTotal: number;
				laborType: string | null;
				unit: string;
				laborUnitCost: number;
				quantity: number;
			}>;
		}> = [];

		let grand = 0;

		for (const [section, items] of Object.entries(grouped)) {
			let sectionLaborTotal = 0;
			const laborItems: Array<{
				description: string;
				laborTotal: number;
				laborType: string | null;
				unit: string;
				laborUnitCost: number;
				quantity: number;
			}> = [];

			for (const item of items ?? []) {
				const laborTotal = Number(item.laborTotal ?? 0);
				if (laborTotal > 0) {
					sectionLaborTotal += laborTotal;
					laborItems.push({
						description: item.description,
						laborTotal,
						laborType: item.laborType,
						unit: item.unit,
						laborUnitCost: Number(item.laborUnitCost ?? 0),
						quantity: Number(item.quantity ?? 0),
					});
				}
			}

			if (laborItems.length > 0) {
				totals.push({
					section,
					label: SECTION_LABELS[section] ?? section,
					laborTotal: sectionLaborTotal,
					items: laborItems,
				});
				grand += sectionLaborTotal;
			}
		}

		return { sectionTotals: totals, grandLaborTotal: grand };
	}, [grouped]);

	// Salary workers calculations
	const salaryTotal = useMemo(() => {
		return workers.reduce((sum, w) => {
			const base = w.count * w.salary * w.months;
			const ins = w.count * w.insurance * w.months;
			const house = w.count * w.housing * w.months;
			return sum + base + ins + house;
		}, 0);
	}, [workers]);

	const addWorker = () => {
		setWorkers((prev) => [
			...prev,
			{
				id: String(Date.now()),
				craft: "",
				count: 1,
				salary: 0,
				months: 1,
				insurance: 0,
				housing: 0,
			},
		]);
	};

	const removeWorker = (id: string) => {
		setWorkers((prev) => prev.filter((w) => w.id !== id));
	};

	const updateWorker = (id: string, field: keyof SalaryWorker, value: string | number) => {
		setWorkers((prev) =>
			prev.map((w) =>
				w.id === id ? { ...w, [field]: typeof value === "string" && field !== "craft" ? Number(value) || 0 : value } : w,
			),
		);
	};

	const laborTypeLabel = (type: string | null) => {
		switch (type) {
			case "PER_SQM":
				return "م²";
			case "PER_CBM":
				return "م³";
			case "PER_UNIT":
				return "وحدة";
			case "PER_LM":
				return "م.ط";
			case "LUMP_SUM":
				return "مقطوعية";
			case "SALARY":
				return "راتب";
			default:
				return "—";
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const totalLabor = grandLaborTotal + salaryTotal;

	return (
		<div className="space-y-4">
			{/* Section-based labor */}
			{sectionTotals.length > 0 && (
				<>
					{sectionTotals.map(({ section, label, laborTotal, items }) => {
						const isExpanded = expandedSections[section] !== false;

						return (
							<div
								key={section}
								className="rounded-xl border border-border bg-card overflow-hidden"
							>
								<button
									type="button"
									onClick={() => toggleSection(section)}
									className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-2">
										{isExpanded ? (
											<ChevronDown className="h-4 w-4 text-muted-foreground" />
										) : (
											<ChevronLeft className="h-4 w-4 text-muted-foreground" />
										)}
										<span className="font-medium">{label}</span>
										<span className="text-xs text-muted-foreground">
											({items.length} بند)
										</span>
									</div>
									<span className="font-medium" dir="ltr">
										{formatNum(laborTotal)} ر.س
									</span>
								</button>

								{isExpanded && (
									<div className="border-t border-border overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b bg-muted/20 text-muted-foreground">
													<th className="px-3 py-2 text-right font-medium">البند</th>
													<th className="px-3 py-2 text-center font-medium">الطريقة</th>
													<th className="px-3 py-2 text-center font-medium">السعر</th>
													<th className="px-3 py-2 text-center font-medium">الكمية</th>
													<th className="px-3 py-2 text-center font-medium">الإجمالي</th>
												</tr>
											</thead>
											<tbody>
												{items.map((item, idx) => (
													<tr
														key={idx}
														className="border-b last:border-0 hover:bg-muted/20"
													>
														<td className="px-3 py-2">{item.description}</td>
														<td className="px-3 py-2 text-center text-xs text-muted-foreground">
															{laborTypeLabel(item.laborType)}
														</td>
														<td className="px-3 py-2 text-center" dir="ltr">
															{item.laborType === "LUMP_SUM"
																? "—"
																: formatNum(item.laborUnitCost)}
														</td>
														<td className="px-3 py-2 text-center" dir="ltr">
															{item.laborType === "LUMP_SUM"
																? "—"
																: formatNum(item.quantity)}
														</td>
														<td className="px-3 py-2 text-center font-medium" dir="ltr">
															{formatNum(item.laborTotal)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						);
					})}
				</>
			)}

			{sectionTotals.length === 0 && salaryTotal === 0 && (
				<div className="rounded-xl border border-border bg-card p-8 text-center">
					<Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
					<p className="text-muted-foreground">
						لا توجد بيانات عمالة — يرجى إدخال أسعار المصنعيات في التبويبات السابقة
					</p>
				</div>
			)}

			{/* Salary-based workers */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-muted-foreground" />
						<h4 className="font-medium">عمالة بالراتب الشهري</h4>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1 text-xs"
						onClick={addWorker}
					>
						<Plus className="h-3.5 w-3.5" />
						إضافة عامل
					</Button>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/20 text-muted-foreground">
								<th className="px-3 py-2 text-right font-medium">الحرفة</th>
								<th className="px-3 py-2 text-center font-medium">العدد</th>
								<th className="px-3 py-2 text-center font-medium">الراتب</th>
								<th className="px-3 py-2 text-center font-medium">الأشهر</th>
								<th className="px-3 py-2 text-center font-medium">التأمين</th>
								<th className="px-3 py-2 text-center font-medium">السكن</th>
								<th className="px-3 py-2 text-center font-medium">الإجمالي</th>
								<th className="px-3 py-2 w-10" />
							</tr>
						</thead>
						<tbody>
							{workers.map((w) => {
								const workerTotal =
									w.count * (w.salary + w.insurance + w.housing) * w.months;
								return (
									<tr key={w.id} className="border-b last:border-0 hover:bg-muted/20">
										<td className="px-3 py-2">
											<Input
												className="h-8 w-28 rounded-lg text-sm"
												value={w.craft}
												onChange={(e) => updateWorker(w.id, "craft", e.target.value)}
												placeholder="الحرفة"
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												type="number"
												className="h-8 w-16 mx-auto text-center rounded-lg"
												dir="ltr"
												value={w.count || ""}
												onChange={(e) => updateWorker(w.id, "count", e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												type="number"
												className="h-8 w-20 mx-auto text-center rounded-lg"
												dir="ltr"
												value={w.salary || ""}
												onChange={(e) => updateWorker(w.id, "salary", e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												type="number"
												className="h-8 w-16 mx-auto text-center rounded-lg"
												dir="ltr"
												value={w.months || ""}
												onChange={(e) => updateWorker(w.id, "months", e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												type="number"
												className="h-8 w-20 mx-auto text-center rounded-lg"
												dir="ltr"
												value={w.insurance || ""}
												onChange={(e) => updateWorker(w.id, "insurance", e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												type="number"
												className="h-8 w-20 mx-auto text-center rounded-lg"
												dir="ltr"
												value={w.housing || ""}
												onChange={(e) => updateWorker(w.id, "housing", e.target.value)}
											/>
										</td>
										<td className="px-3 py-2 text-center font-medium" dir="ltr">
											{formatNum(workerTotal)}
										</td>
										<td className="px-3 py-2">
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
												onClick={() => removeWorker(w.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{workers.length > 0 && (
					<div className="border-t border-border bg-muted/10 px-4 py-3">
						<div className="flex items-center justify-between text-sm font-medium">
							<span>إجمالي العمالة بالراتب</span>
							<span dir="ltr">{formatNum(salaryTotal)} ر.س</span>
						</div>
					</div>
				)}
			</div>

			{/* Grand total */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
				{grandLaborTotal > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">عمالة بالعقود</span>
						<span dir="ltr">{formatNum(grandLaborTotal)} ر.س</span>
					</div>
				)}
				{salaryTotal > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">عمالة بالراتب</span>
						<span dir="ltr">{formatNum(salaryTotal)} ر.س</span>
					</div>
				)}
				<div className="flex items-center justify-between border-t border-primary/20 pt-2">
					<span className="font-semibold">إجمالي العمالة</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{formatNum(totalLabor)} ر.س
					</span>
				</div>
			</div>
		</div>
	);
}
