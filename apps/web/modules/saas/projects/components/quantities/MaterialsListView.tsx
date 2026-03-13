"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
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
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

interface MaterialsListViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const SECTION_LABELS: Record<string, string> = {
	structural: "\u0625\u0646\u0634\u0627\u0626\u064A",
	finishing: "\u062A\u0634\u0637\u064A\u0628\u0627\u062A",
	mep: "MEP",
	labor: "\u0639\u0645\u0627\u0644\u0629",
};

function formatNumber(value: number): string {
	return value.toLocaleString("en-US");
}

function formatCurrency(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function MaterialsListView({
	organizationId,
	organizationSlug,
	projectId,
}: MaterialsListViewProps) {
	const t = useTranslations("projectQuantities");

	const [groupBy, setGroupBy] = useState<"category" | "phase" | "study">(
		"category",
	);

	const { data, isLoading } = useQuery(
		orpc.projectQuantities.getMaterialsList.queryOptions({
			input: { organizationId, projectId, groupBy },
		}),
	);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	const groups = data?.groups ?? [];
	const grandTotal = data?.grandTotal ?? 0;
	const itemCount = data?.itemCount ?? 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
					{t("materials.title")}
				</h1>
				<div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
					<button
						type="button"
						onClick={() => setGroupBy("category")}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
							groupBy === "category"
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
								: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						{t("materials.groupBy.category")}
					</button>
					<button
						type="button"
						onClick={() => setGroupBy("phase")}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
							groupBy === "phase"
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
								: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						{t("materials.groupBy.phase")}
					</button>
					<button
						type="button"
						onClick={() => setGroupBy("study")}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
							groupBy === "study"
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
								: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						{t("materials.groupBy.study")}
					</button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Card className="rounded-2xl">
					<CardContent className="p-5">
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("materials.summary.grandTotal")}
						</p>
						<p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
							{formatCurrency(grandTotal)}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-2xl">
					<CardContent className="p-5">
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("materials.summary.itemCount")}
						</p>
						<p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
							{formatNumber(itemCount)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Groups */}
			{groups.length === 0 && (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("materials.empty")}
					</p>
				</div>
			)}

			{groups.map((group: any) => (
				<Collapsible key={group.label} defaultOpen>
					<div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 text-start dark:border-slate-800"
							>
								<div className="flex items-center gap-3">
									<ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
									<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
										{group.label}
									</h2>
								</div>
								<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
									{formatCurrency(group.total)}
								</span>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("materials.table.section")}</TableHead>
											<TableHead>{t("materials.table.description")}</TableHead>
											<TableHead className="text-end">
												{t("materials.table.quantity")}
											</TableHead>
											<TableHead>{t("materials.table.unit")}</TableHead>
											<TableHead className="text-end">
												{t("materials.table.unitPrice")}
											</TableHead>
											<TableHead className="text-end">
												{t("materials.table.totalCost")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(group.items ?? []).map((item: any, idx: number) => (
											<TableRow key={item.id ?? idx}>
												<TableCell className="text-slate-600 dark:text-slate-400">
													{SECTION_LABELS[item.section] ?? item.section}
												</TableCell>
												<TableCell className="font-medium text-slate-900 dark:text-slate-100">
													{item.description}
												</TableCell>
												<TableCell className="text-end text-slate-600 dark:text-slate-400">
													{formatNumber(item.quantity)}
												</TableCell>
												<TableCell className="text-slate-600 dark:text-slate-400">
													{item.unit}
												</TableCell>
												<TableCell className="text-end text-slate-600 dark:text-slate-400">
													{formatCurrency(item.unitPrice)}
												</TableCell>
												<TableCell className="text-end font-medium text-slate-900 dark:text-slate-100">
													{formatCurrency(item.totalCost)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>
			))}

			{/* Grand Total Footer */}
			{groups.length > 0 && (
				<Card className="rounded-2xl border-2 border-slate-200 dark:border-slate-700">
					<CardContent className="p-5">
						<div className="flex items-center justify-between">
							<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								{t("materials.summary.grandTotal")}
							</p>
							<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{formatCurrency(grandTotal)}
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
