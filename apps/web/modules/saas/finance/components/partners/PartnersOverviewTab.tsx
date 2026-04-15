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
import {
	BarChart3,
	Eye,
	Plus,
	TrendingUp,
	UsersRound,
	Wallet,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { EmptyState } from "@ui/components/empty-state";
import { usePartnerAccess } from "@saas/organizations/hooks/use-partner-access";
import Link from "next/link";

interface PartnersOverviewTabProps {
	organizationId: string;
	organizationSlug: string;
	showSummaryCards?: boolean;
	showReportsButton?: boolean;
}

export function PartnersOverviewTab({
	organizationId,
	organizationSlug,
	showSummaryCards = true,
	showReportsButton = true,
}: PartnersOverviewTabProps) {
	const t = useTranslations();
	const router = useRouter();
	const { canViewProfits, canViewNetBalance, canViewReports, level } =
		usePartnerAccess();

	const basePath = `/app/${organizationSlug}/finance/partners`;

	const { data: rawData, isLoading } = useQuery(
		orpc.accounting.partners.listWithSummary.queryOptions({
			input: { organizationId },
		}),
	);
	const data = rawData as any;
	const partners = (data?.partners ?? []) as any[];
	const totals = data?.totals;

	if (isLoading) return <ListTableSkeleton rows={5} cols={6} />;

	if (level === "none") {
		return (
			<EmptyState
				icon={<UsersRound className="h-8 w-8" />}
				description={t("finance.partners.access.accessDenied")}
			/>
		);
	}

	if (partners.length === 0) {
		return (
			<EmptyState
				icon={<UsersRound className="h-8 w-8" />}
				title={t("finance.partners.noPartners")}
				description={t("finance.partners.noPartnersDescription")}
			>
				<Button asChild className="rounded-xl">
					<Link href={`/app/${organizationSlug}/settings/owners`}>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.partners.goToSettings")}
					</Link>
				</Button>
			</EmptyState>
		);
	}

	return (
		<div className="space-y-6">
			{level === "limited" && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
					{t("finance.partners.access.limitedAccountant")}
				</div>
			)}

			{showSummaryCards && canViewProfits && totals && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
					<Card className="rounded-2xl">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
									<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<div className="min-w-0">
									<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
										{t("finance.partners.summary.totalProfit")}
									</p>
									<p className="text-base sm:text-xl font-semibold tabular-nums break-words">
										<Currency amount={totals.netProfit ?? 0} />
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="rounded-2xl">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-xl shrink-0">
									<Wallet className="h-5 w-5 text-sky-600 dark:text-sky-400" />
								</div>
								<div className="min-w-0">
									<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
										{t("finance.partners.totalContributions")}
									</p>
									<p className="text-base sm:text-xl font-semibold tabular-nums break-words">
										<Currency amount={totals.totalContributions ?? 0} />
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="rounded-2xl">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl shrink-0">
									<TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div className="min-w-0">
									<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
										{t("finance.partners.totalDrawings")}
									</p>
									<p className="text-base sm:text-xl font-semibold tabular-nums break-words">
										<Currency amount={totals.totalDrawings ?? 0} />
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="rounded-2xl">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl shrink-0">
									<BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
								</div>
								<div className="min-w-0">
									<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
										{t("finance.partners.shareOfProfit")}
									</p>
									<p className="text-base sm:text-xl font-semibold tabular-nums break-words">
										<Currency amount={totals.totalShareOfProfit ?? 0} />
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-lg font-semibold">
					{t("finance.partners.title")}
				</h2>
				{showReportsButton && canViewReports && (
					<Button asChild variant="outline" size="sm" className="rounded-xl">
						<Link href={`${basePath}/reports`}>
							<BarChart3 className="me-2 h-4 w-4" />
							{t("finance.partners.actions.viewReports")}
						</Link>
					</Button>
				)}
			</div>

			<Card className="rounded-2xl overflow-hidden">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
					<Table className="min-w-[700px]">
						<TableHeader>
							<TableRow>
								<TableHead className="whitespace-nowrap">{t("finance.partners.partner")}</TableHead>
								<TableHead className="whitespace-nowrap">
									{t("finance.partners.ownershipPercent")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.totalContributions")}
								</TableHead>
								<TableHead className="text-end whitespace-nowrap">
									{t("finance.partners.totalDrawings")}
								</TableHead>
								{canViewProfits && (
									<TableHead className="text-end whitespace-nowrap">
										{t("finance.partners.shareOfProfit")}
									</TableHead>
								)}
								{canViewNetBalance && (
									<TableHead className="text-end whitespace-nowrap">
										{t("finance.partners.netBalance")}
									</TableHead>
								)}
								<TableHead className="w-[60px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{partners.map((p: any) => (
								<TableRow
									key={p.id}
									className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
									onClick={() => router.push(`${basePath}/${p.id}`)}
								>
									<TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
									<TableCell className="whitespace-nowrap">
										<Badge variant="outline" className="rounded-lg">
											{new Intl.NumberFormat("en-US", {
												maximumFractionDigits: 2,
											}).format(p.ownershipPercent)}
											%
										</Badge>
									</TableCell>
									<TableCell className="text-end tabular-nums whitespace-nowrap">
										<Currency amount={p.totalContributions} />
									</TableCell>
									<TableCell className="text-end tabular-nums text-red-600 dark:text-red-400 whitespace-nowrap">
										<Currency amount={p.totalDrawings} />
									</TableCell>
									{canViewProfits && (
										<TableCell className="text-end tabular-nums whitespace-nowrap">
											<Currency amount={p.shareOfProfit ?? 0} />
										</TableCell>
									)}
									{canViewNetBalance && (
										<TableCell
											className={`text-end tabular-nums font-semibold whitespace-nowrap ${
												(p.netBalance ?? 0) >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-red-600 dark:text-red-400"
											}`}
										>
											<Currency amount={p.netBalance ?? 0} />
										</TableCell>
									)}
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0"
											onClick={(e) => {
												e.stopPropagation();
												router.push(`${basePath}/${p.id}`);
											}}
										>
											<Eye className="h-4 w-4" />
										</Button>
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
