"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent } from "@ui/components/card";
import {
	AlertTriangle,
	Clock,
	FileText,
	TrendingUp,
	Scale,
	BookOpen,
	Target,
	HeartPulse,
} from "lucide-react";

interface AccountingReportsLandingProps {
	organizationId: string;
	organizationSlug: string;
}

type ReportItem = {
	id: string;
	icon: typeof AlertTriangle;
	color: string;
	bgColor: string;
	labelKey: string;
	descKey: string;
};

const BASIC_REPORTS: ReportItem[] = [
	{
		id: "aged-receivables",
		icon: AlertTriangle,
		color: "text-destructive",
		bgColor: "bg-destructive/15",
		labelKey: "finance.accountingReports.agedReceivables",
		descKey: "finance.accountingReports.agedReceivablesDesc",
	},
	{
		id: "aged-payables",
		icon: Clock,
		color: "text-chart-1",
		bgColor: "bg-chart-1/15",
		labelKey: "finance.accountingReports.agedPayables",
		descKey: "finance.accountingReports.agedPayablesDesc",
	},
	{
		id: "vat-report",
		icon: FileText,
		color: "text-success",
		bgColor: "bg-success/15",
		labelKey: "finance.accountingReports.vatReport",
		descKey: "finance.accountingReports.vatReportDesc",
	},
	{
		id: "cost-center",
		icon: Target,
		color: "text-chart-1 dark:text-chart-1",
		bgColor: "bg-chart-1/20 dark:bg-chart-1/25",
		labelKey: "finance.accountingReports.costCenter",
		descKey: "finance.accountingReports.costCenterDesc",
	},
];

const ACCOUNTING_REPORTS: ReportItem[] = [
	{
		// Single income statement, sourced from the POSTED ledger. The old
		// "journal-income-statement" card was removed; this route now renders the
		// same journal-based report.
		id: "income-statement",
		icon: TrendingUp,
		color: "text-chart-4 dark:text-chart-4",
		bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		labelKey: "finance.accountingReports.incomeStatement",
		descKey: "finance.accountingReports.incomeStatementDesc",
	},
	{
		id: "trial-balance",
		icon: Scale,
		color: "text-chart-4 dark:text-chart-4",
		bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		labelKey: "finance.accounting.trialBalance.title",
		descKey: "finance.accounting.trialBalance.noEntries",
	},
	{
		id: "balance-sheet",
		icon: BookOpen,
		color: "text-chart-4 dark:text-chart-4",
		bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		labelKey: "finance.accounting.balanceSheet.title",
		descKey: "finance.accounting.balanceSheet.balanced",
	},
];

const TOOLS: ReportItem[] = [
	{
		id: "health",
		icon: HeartPulse,
		color: "text-success dark:text-success",
		bgColor: "bg-success/15 dark:bg-success/20",
		labelKey: "finance.accountingReports.healthCheck",
		descKey: "finance.accountingReports.healthCheckDesc",
	},
];

function ReportCard({ report, basePath, t }: { report: ReportItem; basePath: string; t: (key: string) => string }) {
	const Icon = report.icon;
	return (
		<Link href={`${basePath}/${report.id}`}>
			<Card className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer group">
				<CardContent className="p-6">
					<div className="flex items-start gap-4">
						<div className={`p-3 rounded-xl ${report.bgColor} group-hover:scale-110 transition-transform`}>
							<Icon className={`h-6 w-6 ${report.color}`} />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-muted-foreground dark:text-muted-foreground group-hover:text-primary transition-colors">
								{t(report.labelKey)}
							</h3>
							<p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
								{t(report.descKey)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

export function AccountingReportsLanding({
	organizationId,
	organizationSlug,
}: AccountingReportsLandingProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/accounting-reports`;

	const sections = [
		{ title: t("finance.accountingReports.basicReports"), reports: BASIC_REPORTS },
		{ title: t("finance.accountingReports.accountingReports"), reports: ACCOUNTING_REPORTS },
		{ title: t("finance.accountingReports.tools"), reports: TOOLS },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground">
					{t("finance.accountingReports.title")}
				</h1>
				<p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
					{t("finance.accountingReports.subtitle")}
				</p>
			</div>

			{sections.map((section) => (
				<div key={section.title} className="space-y-3">
					<h2 className="text-lg font-semibold text-muted-foreground dark:text-muted-foreground">
						{section.title}
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{section.reports.map((report) => (
							<ReportCard key={report.id} report={report} basePath={basePath} t={t} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}
