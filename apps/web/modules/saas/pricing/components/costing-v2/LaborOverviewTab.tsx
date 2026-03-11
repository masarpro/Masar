"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";

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

export function LaborOverviewTab({
	organizationId,
	studyId,
}: LaborOverviewTabProps) {
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		STRUCTURAL: true,
		FINISHING: true,
		MEP: true,
	});

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

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// Group costing items by section and filter those with labor costs
	const grouped = (costingItems ?? []).reduce(
		(acc, item) => {
			const section = item.section;
			if (!acc[section]) acc[section] = [];
			acc[section].push(item);
			return acc;
		},
		{} as Record<string, typeof costingItems>,
	);

	// Calculate section totals
	const sectionTotals: Array<{
		section: string;
		label: string;
		laborTotal: number;
		items: Array<{ description: string; laborTotal: number; laborType: string | null; unit: string }>;
	}> = [];

	let grandLaborTotal = 0;

	for (const [section, items] of Object.entries(grouped)) {
		let sectionLaborTotal = 0;
		const laborItems: Array<{
			description: string;
			laborTotal: number;
			laborType: string | null;
			unit: string;
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
				});
			}
		}

		if (laborItems.length > 0) {
			sectionTotals.push({
				section,
				label: SECTION_LABELS[section] ?? section,
				laborTotal: sectionLaborTotal,
				items: laborItems,
			});
			grandLaborTotal += sectionLaborTotal;
		}
	}

	if (sectionTotals.length === 0) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center">
				<p className="text-muted-foreground">
					لا توجد بيانات عمالة — يرجى إدخال أسعار المصنعيات في التبويبات السابقة
				</p>
			</div>
		);
	}

	const laborTypeLabel = (type: string | null) => {
		switch (type) {
			case "PER_SQM":
				return "بالمتر المسطح";
			case "PER_CBM":
				return "بالمتر المكعب";
			case "PER_UNIT":
				return "بالوحدة";
			case "PER_LM":
				return "بالمتر الطولي";
			case "LUMP_SUM":
				return "مقطوعية";
			case "SALARY":
				return "راتب شهري";
			default:
				return "—";
		}
	};

	return (
		<div className="space-y-4">
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

			{/* Grand total */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
				<div className="flex items-center justify-between">
					<span className="font-semibold">إجمالي العمالة</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{formatNum(grandLaborTotal)} ر.س
					</span>
				</div>
			</div>
		</div>
	);
}
