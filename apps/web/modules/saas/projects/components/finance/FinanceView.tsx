"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ClaimsTable } from "./ClaimsTable";
import { ExpensesTable } from "./ExpensesTable";
import { FinanceSummary } from "./FinanceSummary";

interface FinanceViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function FinanceView({
	organizationId,
	organizationSlug,
	projectId,
}: FinanceViewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const financePath = `${basePath}/finance`;

	const [activeTab, setActiveTab] = useState<"claims" | "expenses">("claims");
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		undefined,
	);

	// Fetch summary data
	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch claims
	const {
		data: claimsData,
		isLoading: claimsLoading,
		refetch: refetchClaims,
	} = useQuery(
		orpc.projectFinance.listClaims.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch expenses
	const {
		data: expensesData,
		isLoading: expensesLoading,
		refetch: refetchExpenses,
	} = useQuery(
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

	const isLoading = summaryLoading || claimsLoading || expensesLoading;

	if (isLoading) {
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
				remaining={summary?.remaining ?? 0}
				claimsPaid={summary?.claimsPaid ?? 0}
			/>

			{/* Tabs Section */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "claims" | "expenses")}
				>
					<div className="mb-6 flex items-center justify-between">
						<TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800">
							<TabsTrigger
								value="claims"
								className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
							>
								{t("finance.claims.title")}
							</TabsTrigger>
							<TabsTrigger
								value="expenses"
								className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
							>
								{t("finance.expenses.title")}
							</TabsTrigger>
						</TabsList>

						{activeTab === "claims" && (
							<Button asChild className="rounded-xl">
								<Link href={`${financePath}/new-claim`}>
									<Plus className="me-2 h-4 w-4" />
									{t("finance.claims.new")}
								</Link>
							</Button>
						)}
					</div>

					<TabsContent value="claims" className="mt-0">
						<ClaimsTable
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							projectId={projectId}
							claims={claimsData?.claims ?? []}
							onRefresh={() => {
								refetchClaims();
							}}
						/>
					</TabsContent>

					<TabsContent value="expenses" className="mt-0">
						<ExpensesTable
							organizationSlug={organizationSlug}
							projectId={projectId}
							expenses={expensesData?.expenses ?? []}
							selectedCategory={selectedCategory}
							onCategoryChange={(cat) => {
								setSelectedCategory(cat);
								refetchExpenses();
							}}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
