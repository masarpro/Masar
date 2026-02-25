"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Calculator, FileSpreadsheet, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface PricingDashboardProps {
	organizationId: string;
	organizationSlug: string;
}

export function PricingDashboard({
	organizationId,
	organizationSlug,
}: PricingDashboardProps) {
	const t = useTranslations();

	// Fetch studies list
	const { data: studiesData } = useQuery(
		orpc.pricing.studies.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch quotations list
	const { data: quotationsData } = useQuery(
		orpc.pricing.quotations.list.queryOptions({
			input: { organizationId, limit: 100 },
		}),
	);

	const studies = studiesData?.studies ?? [];
	const quotations = quotationsData?.quotations ?? [];

	const totalStudies = studies.length;
	const totalQuotations = quotations.length;
	const acceptedQuotations = quotations.filter((q) => q.status === "ACCEPTED").length;
	const pendingQuotations = quotations.filter((q) => q.status === "SENT" || q.status === "VIEWED").length;
	const acceptanceRate = totalQuotations > 0
		? Math.round((acceptedQuotations / totalQuotations) * 100)
		: 0;

	const basePath = `/app/${organizationSlug}/pricing`;

	return (
		<div className="space-y-6" dir="rtl">
			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
								<Calculator className="h-5 w-5 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{totalStudies}</p>
								<p className="text-xs text-muted-foreground">{t("pricing.shell.sections.studies")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
								<FileSpreadsheet className="h-5 w-5 text-violet-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{totalQuotations}</p>
								<p className="text-xs text-muted-foreground">{t("pricing.shell.sections.quotations")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
								<TrendingUp className="h-5 w-5 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{acceptanceRate}%</p>
								<p className="text-xs text-muted-foreground">{t("finance.reports.conversionRate")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
								<Clock className="h-5 w-5 text-amber-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{pendingQuotations}</p>
								<p className="text-xs text-muted-foreground">{t("pricing.quotations.status.sent")}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card className="rounded-2xl">
					<CardHeader className="pb-3">
						<CardTitle className="text-base flex items-center gap-2">
							<Calculator className="h-4 w-4" />
							{t("pricing.shell.sections.studies")}
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex gap-2">
							<Button asChild variant="outline" className="rounded-xl flex-1">
								<Link href={`${basePath}/studies`}>
									{t("common.viewAll")}
								</Link>
							</Button>
							<Button asChild className="rounded-xl flex-1">
								<Link href={`${basePath}/studies/new`}>
									<Plus className="h-4 w-4 me-2" />
									{t("pricing.studies.createStudy")}
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardHeader className="pb-3">
						<CardTitle className="text-base flex items-center gap-2">
							<FileSpreadsheet className="h-4 w-4" />
							{t("pricing.shell.sections.quotations")}
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex gap-2">
							<Button asChild variant="outline" className="rounded-xl flex-1">
								<Link href={`${basePath}/quotations`}>
									{t("common.viewAll")}
								</Link>
							</Button>
							<Button asChild className="rounded-xl flex-1">
								<Link href={`${basePath}/quotations/new`}>
									<Plus className="h-4 w-4 me-2" />
									{t("pricing.quotations.create")}
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
