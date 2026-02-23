"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ExpenseCategoryChart } from "./ExpenseCategoryChart";
import { ExpensesTable } from "./ExpensesTable";
import { FinanceSummary } from "./FinanceSummary";
import { SubcontractsTab } from "./SubcontractsTab";

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

	if (summaryLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<FinanceSummary
				contractValue={summary?.contractValue ?? 0}
				actualExpenses={summary?.actualExpenses ?? 0}
				totalPayments={summary?.totalPayments ?? 0}
				remaining={summary?.remaining ?? 0}
				claimsPaid={summary?.claimsPaid ?? 0}
				adjustedContractValue={summary?.adjustedContractValue}
				changeOrdersImpact={summary?.changeOrdersImpact}
			/>

			{/* Main Content: Tabs + Chart */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
				{/* Tabs */}
				<Tabs defaultValue="expenses" className="min-w-0">
					<TabsList className="mb-4 w-full justify-start">
						<TabsTrigger value="expenses">
							{t("finance.projectHub.tabs.expenses")}
						</TabsTrigger>
						<TabsTrigger value="subcontracts">
							{t("finance.projectHub.tabs.subcontracts")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="expenses">
						<ExpensesTable
							organizationSlug={organizationSlug}
							projectId={projectId}
							expenses={
								expensesData?.expenses?.map((e) => ({
									...e,
									date: new Date(e.date),
									createdAt: new Date(e.createdAt),
									amount: typeof e.amount === "number" ? e.amount : Number(e.amount),
								})) ?? []
							}
							selectedCategory={selectedCategory}
							onCategoryChange={setSelectedCategory}
						/>
					</TabsContent>

					<TabsContent value="subcontracts">
						<SubcontractsTab
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							projectId={projectId}
						/>
					</TabsContent>
				</Tabs>

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
