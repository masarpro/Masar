"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	CheckCircle,
	AlertTriangle,
	RefreshCw,
	FileText,
	HeartPulse,
} from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

interface AccountingHealthPageProps {
	organizationId: string;
	organizationSlug: string;
}

export function AccountingHealthPage({
	organizationId,
	organizationSlug,
}: AccountingHealthPageProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		orpc.accounting.health.check.queryOptions({
			input: { organizationId },
		}),
	);

	const backfillMutation = useMutation({
		...orpc.accounting.backfill.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounting"] });
		},
	});

	if (isLoading) return <DashboardSkeleton />;
	if (!data) return null;

	const totalIssues =
		(data.unbalancedEntries?.length ?? 0) +
		(data.invoicesWithoutEntries?.length ?? 0) +
		(data.orphanedInvoiceEntries?.length ?? 0) +
		(data.expensesWithoutEntries?.length ?? 0);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					{t("finance.accounting.health.title")}
				</h1>
			</div>

			{/* Summary */}
			<Card className={`rounded-2xl border-2 ${data.isHealthy ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}>
				<CardContent className="p-6 flex items-center gap-4">
					{data.isHealthy ? (
						<CheckCircle className="h-10 w-10 text-green-600" />
					) : (
						<HeartPulse className="h-10 w-10 text-red-600" />
					)}
					<div>
						<h2 className="text-lg font-bold">
							{data.isHealthy
								? t("finance.accounting.health.healthy")
								: t("finance.accounting.health.issues", { count: totalIssues })}
						</h2>
						{!data.isHealthy && (
							<p className="text-sm text-slate-500 mt-1">
								{t("finance.accounting.health.reviewBelow")}
							</p>
						)}
					</div>
					{!data.isHealthy && (
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl ms-auto"
							onClick={() => backfillMutation.mutate({ organizationId })}
							disabled={backfillMutation.isPending}
						>
							<RefreshCw className={`h-4 w-4 me-1 ${backfillMutation.isPending ? "animate-spin" : ""}`} />
							{t("finance.accounting.health.runBackfill")}
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Backfill Result */}
			{backfillMutation.data && backfillMutation.data.total > 0 && (
				<div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
					<CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
					<span className="text-sm text-green-700 dark:text-green-300">
						{t("finance.accounting.backfill.success", { total: backfillMutation.data.total })}
					</span>
				</div>
			)}

			{/* Check Sections */}
			<div className="grid gap-4">
				{/* Unbalanced Entries */}
				<HealthCheckSection
					title={t("finance.accounting.health.unbalanced")}
					count={data.unbalancedEntries?.length ?? 0}
					icon={<AlertTriangle className="h-5 w-5" />}
				>
					{data.unbalancedEntries?.map((e: any) => (
						<div key={e.id} className="flex items-center justify-between py-1 text-sm">
							<span className="font-mono">{e.entry_no}</span>
							<span className="text-red-600">{t("finance.accounting.health.diffAmount")}: {Number(e.diff).toFixed(2)}</span>
						</div>
					))}
				</HealthCheckSection>

				{/* Invoices Without Entries */}
				<HealthCheckSection
					title={t("finance.accounting.health.missing")}
					count={data.invoicesWithoutEntries?.length ?? 0}
					icon={<FileText className="h-5 w-5" />}
					subtitle={`${t("finance.invoices.title")} → ${t("finance.accounting.health.missingEntries")}`}
				>
					{data.invoicesWithoutEntries?.map((inv: any) => (
						<div key={inv.id} className="flex items-center justify-between py-1 text-sm">
							<span className="font-mono">{inv.invoice_no}</span>
							<Badge variant="outline" className="text-xs">{inv.status}</Badge>
						</div>
					))}
				</HealthCheckSection>

				{/* Expenses Without Entries */}
				<HealthCheckSection
					title={t("finance.accounting.health.missingExpenseEntries")}
					count={data.expensesWithoutEntries?.length ?? 0}
					icon={<FileText className="h-5 w-5" />}
				>
					{data.expensesWithoutEntries?.map((exp: any) => (
						<div key={exp.id} className="py-1 text-sm truncate">
							{exp.description || exp.id}
						</div>
					))}
				</HealthCheckSection>

				{/* Orphaned Entries */}
				<HealthCheckSection
					title={t("finance.accounting.health.orphaned")}
					count={data.orphanedInvoiceEntries?.length ?? 0}
					icon={<AlertTriangle className="h-5 w-5" />}
				>
					{data.orphanedInvoiceEntries?.map((e: any) => (
						<div key={e.id} className="flex items-center justify-between py-1 text-sm">
							<span className="font-mono">{e.entry_no}</span>
							<span className="text-xs text-slate-500">{e.reference_id}</span>
						</div>
					))}
				</HealthCheckSection>
			</div>
		</div>
	);
}

function HealthCheckSection({
	title,
	subtitle,
	count,
	icon,
	children,
}: {
	title: string;
	subtitle?: string;
	count: number;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	const isOk = count === 0;

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-3 text-base">
					<div className={`p-2 rounded-lg ${isOk ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
						{isOk ? <CheckCircle className="h-5 w-5" /> : icon}
					</div>
					<div className="flex-1">
						<span>{title}</span>
						{subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>}
					</div>
					<Badge variant={isOk ? "secondary" : "destructive"} className="text-xs">
						{count}
					</Badge>
				</CardTitle>
			</CardHeader>
			{count > 0 && (
				<CardContent className="pt-0 divide-y divide-border">
					{children}
				</CardContent>
			)}
		</Card>
	);
}
