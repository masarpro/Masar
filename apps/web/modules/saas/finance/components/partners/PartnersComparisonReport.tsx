"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { ArrowLeft, BarChart3, TrendingUp, Wallet } from "lucide-react";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { EmptyState } from "@ui/components/empty-state";
import { usePartnerAccess } from "@saas/organizations/hooks/use-partner-access";

interface PartnersComparisonReportProps {
	organizationId: string;
	organizationSlug: string;
}

export function PartnersComparisonReport({
	organizationId,
	organizationSlug,
}: PartnersComparisonReportProps) {
	const t = useTranslations();
	const router = useRouter();
	const { canViewReports } = usePartnerAccess();

	const basePath = `/app/${organizationSlug}/finance/partners`;

	const { data: rawData, isLoading, error } = useQuery({
		...orpc.accounting.partners.comparisonReport.queryOptions({
			input: { organizationId },
		}),
		enabled: canViewReports,
		retry: false,
	});

	if (!canViewReports) {
		return (
			<EmptyState
				icon={<BarChart3 className="h-8 w-8" />}
				description={t("finance.partners.access.ownerOnly")}
			>
				<Button
					variant="outline"
					className="rounded-xl"
					onClick={() => router.push(basePath)}
				>
					<ArrowLeft className="me-2 h-4 w-4" />
					{t("common.back")}
				</Button>
			</EmptyState>
		);
	}

	if (isLoading) return <ListTableSkeleton rows={5} cols={6} />;

	if (error || !rawData) {
		return (
			<EmptyState
				icon={<BarChart3 className="h-8 w-8" />}
				description={(error as any)?.message ?? t("common.errorOccurred")}
			/>
		);
	}

	const data = rawData as any;
	const rows = data.partners as any[];
	const totals = data.totals;
	const company = data.company;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button
					variant="ghost"
					className="rounded-xl"
					onClick={() => router.push(basePath)}
				>
					<ArrowLeft className="me-2 h-4 w-4" />
					{t("common.back")}
				</Button>
				<h2 className="text-base sm:text-lg font-semibold">
					{t("finance.partners.reports.title")} {data.year}
				</h2>
			</div>

			{/* Company summary */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
				<SummaryCard
					icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
					bg="bg-emerald-100 dark:bg-emerald-900/50"
					label={t("finance.partners.summary.totalProfit")}
					value={company.netProfit}
				/>
				<SummaryCard
					icon={<Wallet className="h-5 w-5 text-sky-600" />}
					bg="bg-sky-100 dark:bg-sky-900/50"
					label={t("finance.partners.totalContributions")}
					value={totals.totalContributions}
				/>
				<SummaryCard
					icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
					bg="bg-purple-100 dark:bg-purple-900/50"
					label={t("finance.partners.totalDrawings")}
					value={totals.totalDrawings}
				/>
			</div>

			<Card className="rounded-2xl overflow-hidden">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
					<Table className="min-w-[800px]">
						<TableHeader>
							<TableRow>
								<TableHead className="whitespace-nowrap">{t("finance.partners.reports.owner")}</TableHead>
								<TableHead className="whitespace-nowrap">
									{t("finance.partners.reports.percentage")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.totalContributions")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.shareOfProfit")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.totalDrawings")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.netBalance")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((r) => (
								<TableRow
									key={r.id}
									className="cursor-pointer hover:bg-slate-50"
									onClick={() => router.push(`${basePath}/${r.id}`)}
								>
									<TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
									<TableCell className="whitespace-nowrap">
										<Badge variant="outline" className="rounded-lg">
											{new Intl.NumberFormat("en-US", {
												maximumFractionDigits: 2,
											}).format(r.ownershipPercent)}
											%
										</Badge>
									</TableCell>
									<TableCell className="text-end tabular-nums whitespace-nowrap">
										<Currency amount={r.totalContributions} />
									</TableCell>
									<TableCell className="text-end tabular-nums whitespace-nowrap">
										<Currency amount={r.shareOfProfit} />
									</TableCell>
									<TableCell className="text-end tabular-nums text-red-600 whitespace-nowrap">
										<Currency amount={r.totalDrawings} />
									</TableCell>
									<TableCell
										className={`text-end tabular-nums font-semibold whitespace-nowrap ${
											r.netBalance >= 0
												? "text-emerald-600"
												: "text-red-600"
										}`}
									>
										<Currency amount={r.netBalance} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function SummaryCard({
	icon,
	bg,
	label,
	value,
}: {
	icon: React.ReactNode;
	bg: string;
	label: string;
	value: number;
}) {
	return (
		<Card className="rounded-2xl">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className={`p-2 ${bg} rounded-xl shrink-0`}>{icon}</div>
					<div className="min-w-0">
						<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
							{label}
						</p>
						<p className="text-base sm:text-xl font-semibold tabular-nums break-words">
							<Currency amount={value} />
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
