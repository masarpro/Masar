"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";

const ExpenseCategoryChart = dynamic(
	() => import("./ExpenseCategoryChart").then((m) => ({ default: m.ExpenseCategoryChart })),
	{ loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />, ssr: false },
);
import { ExpensesTable } from "./ExpensesTable";
import { FinanceSummary } from "./FinanceSummary";

interface ProjectFinanceHubProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectFinanceHub({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectFinanceHubProps) {
	const t = useTranslations();
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");

	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: categoryData } = useQuery(
		orpc.projectFinance.getExpensesByCategory.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: expensesData, isLoading: expensesLoading } = useQuery(
		orpc.projectFinance.listExpenses.queryOptions({
			input: {
				organizationId,
				projectId,
				category: selectedCategory as
					| "MATERIALS"
					| "LABOR"
					| "EQUIPMENT"
					| "SUBCONTRACTOR"
					| "TRANSPORT"
					| "MISC"
					| undefined,
			},
		}),
	);

	// Client-side search filter
	const allExpenses =
		expensesData?.expenses?.map((e) => ({
			...e,
			date: new Date(e.date),
			createdAt: new Date(e.createdAt),
			amount: typeof e.amount === "number" ? e.amount : Number(e.amount),
		})) ?? [];

	const filteredExpenses = searchQuery
		? allExpenses.filter((e) => {
				const q = searchQuery.toLowerCase();
				return (
					(e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
					(e.description && e.description.toLowerCase().includes(q)) ||
					(e.note && e.note.toLowerCase().includes(q))
				);
			})
		: allExpenses;

	if (summaryLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<FinanceSummary
				contractValue={Number(summary?.contractValue ?? 0)}
				actualExpenses={Number(summary?.actualExpenses ?? 0)}
				totalPayments={Number(summary?.totalPayments ?? 0)}
				remaining={Number(summary?.remaining ?? 0)}
				claimsPaid={Number(summary?.claimsPaid ?? 0)}
				adjustedContractValue={summary?.adjustedContractValue != null ? Number(summary.adjustedContractValue) : undefined}
				changeOrdersImpact={summary?.changeOrdersImpact != null ? Number(summary.changeOrdersImpact) : undefined}
			/>

			{/* Main Content: Expenses + Chart */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
				{/* Expenses Table */}
				<ExpensesTable
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					projectId={projectId}
					expenses={filteredExpenses}
					isLoading={expensesLoading}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
				/>

				{/* Donut Chart */}
				<div className="hidden lg:block">
					<ExpenseCategoryChart
						data={categoryData ?? []}
						selectedCategory={selectedCategory}
						onCategoryClick={setSelectedCategory}
					/>
				</div>
			</div>

			{/* Mobile Chart - shown below on small screens */}
			<div className="lg:hidden">
				<ExpenseCategoryChart
					data={categoryData ?? []}
					selectedCategory={selectedCategory}
					onCategoryClick={setSelectedCategory}
				/>
			</div>
		</div>
	);
}
