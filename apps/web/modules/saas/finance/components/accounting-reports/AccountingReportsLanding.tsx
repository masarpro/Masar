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
	BarChart3,
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
		color: "text-red-600 dark:text-red-400",
		bgColor: "bg-red-100 dark:bg-red-900/30",
		labelKey: "finance.accountingReports.agedReceivables",
		descKey: "finance.accountingReports.agedReceivablesDesc",
	},
	{
		id: "aged-payables",
		icon: Clock,
		color: "text-amber-600 dark:text-amber-400",
		bgColor: "bg-amber-100 dark:bg-amber-900/30",
		labelKey: "finance.accountingReports.agedPayables",
		descKey: "finance.accountingReports.agedPayablesDesc",
	},
	{
		id: "vat-report",
		icon: FileText,
		color: "text-green-600 dark:text-green-400",
		bgColor: "bg-green-100 dark:bg-green-900/30",
		labelKey: "finance.accountingReports.vatReport",
		descKey: "finance.accountingReports.vatReportDesc",
	},
	{
		id: "cost-center",
		icon: Target,
		color: "text-orange-600 dark:text-orange-400",
		bgColor: "bg-orange-100 dark:bg-orange-900/30",
		labelKey: "finance.accountingReports.costCenter",
		descKey: "finance.accountingReports.costCenterDesc",
	},
];

const ACCOUNTING_REPORTS: ReportItem[] = [
	{
		id: "journal-income-statement",
		icon: BarChart3,
		color: "text-teal-600 dark:text-teal-400",
		bgColor: "bg-teal-100 dark:bg-teal-900/30",
		labelKey: "finance.accounting.incomeStatement.title",
		descKey: "finance.accounting.incomeStatement.revenue",
	},
	{
		id: "income-statement",
		icon: TrendingUp,
		color: "text-blue-600 dark:text-blue-400",
		bgColor: "bg-blue-100 dark:bg-blue-900/30",
		labelKey: "finance.accountingReports.incomeStatement",
		descKey: "finance.accountingReports.incomeStatementDesc",
	},
	{
		id: "trial-balance",
		icon: Scale,
		color: "text-indigo-600 dark:text-indigo-400",
		bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
		labelKey: "finance.accounting.trialBalance.title",
		descKey: "finance.accounting.trialBalance.noEntries",
	},
	{
		id: "balance-sheet",
		icon: BookOpen,
		color: "text-violet-600 dark:text-violet-400",
		bgColor: "bg-violet-100 dark:bg-violet-900/30",
		labelKey: "finance.accounting.balanceSheet.title",
		descKey: "finance.accounting.balanceSheet.balanced",
	},
];

const TOOLS: ReportItem[] = [
	{
		id: "health",
		icon: HeartPulse,
		color: "text-emerald-600 dark:text-emerald-400",
		bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
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
							<h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
								{t(report.labelKey)}
							</h3>
							<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
				<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					{t("finance.accountingReports.title")}
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
					{t("finance.accountingReports.subtitle")}
				</p>
			</div>

			{sections.map((section) => (
				<div key={section.title} className="space-y-3">
					<h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
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
