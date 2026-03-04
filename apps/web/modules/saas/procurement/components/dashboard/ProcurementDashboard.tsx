"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	FileText,
	ShoppingCart,
	PackageCheck,
	Receipt,
	TrendingDown,
	Building2,
	AlertCircle,
	Calendar,
} from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";
import Link from "next/link";

interface ProcurementDashboardProps {
	organizationId: string;
	organizationSlug: string;
}

export function ProcurementDashboard({
	organizationId,
	organizationSlug,
}: ProcurementDashboardProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.procurement.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const basePath = `/app/${organizationSlug}/procurement`;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
								<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.pendingRequests")}
								</p>
								<p className="text-2xl font-semibold">{data?.pendingRequests ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
								<ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.activeOrders")}
								</p>
								<p className="text-2xl font-semibold">{data?.activeOrders ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
								<PackageCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.pendingReceipts")}
								</p>
								<p className="text-2xl font-semibold">{data?.pendingReceipts ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-xl">
								<Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.unpaidInvoices")}
								</p>
								<p className="text-2xl font-semibold">{data?.unpaidInvoices ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
								<TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.monthlySpend")}
								</p>
								<p className="text-xl font-semibold">
									<Currency amount={data?.monthlySpend ?? 0} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl">
								<Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("procurement.stats.totalVendors")}
								</p>
								<p className="text-2xl font-semibold">{data?.totalVendors ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent PRs and Overdue Invoices */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Recent Purchase Requests */}
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-lg">
							{t("procurement.recentRequests")}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{(data?.recentPRs?.length ?? 0) === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
								<FileText className="h-8 w-8 mb-2" />
								<p>{t("procurement.noRequests")}</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("procurement.prNumber")}</TableHead>
										<TableHead>{t("procurement.requestTitle")}</TableHead>
										<TableHead>{t("procurement.status")}</TableHead>
										<TableHead className="text-end">{t("procurement.estimatedTotal")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.recentPRs?.map((pr) => (
										<TableRow key={pr.id} className="cursor-pointer hover:bg-muted/50">
											<TableCell>
												<Link
													href={`${basePath}/requests/${pr.id}`}
													className="font-mono text-sm hover:underline"
												>
													{pr.prNumber}
												</Link>
											</TableCell>
											<TableCell className="max-w-[200px] truncate">
												{pr.title}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="rounded-lg text-xs">
													{t(`procurement.prStatuses.${pr.status}`)}
												</Badge>
											</TableCell>
											<TableCell className="text-end">
												<Currency amount={pr.estimatedTotal} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				{/* Overdue Invoices */}
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-red-500" />
							{t("procurement.overdueInvoices")}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{(data?.overdueInvoices?.length ?? 0) === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
								<Receipt className="h-8 w-8 mb-2" />
								<p>{t("procurement.noInvoices")}</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("procurement.viNumber")}</TableHead>
										<TableHead>{t("procurement.vendor")}</TableHead>
										<TableHead>{t("procurement.dueDate")}</TableHead>
										<TableHead className="text-end">{t("procurement.remainingAmount")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.overdueInvoices?.map((vi) => (
										<TableRow key={vi.id} className="cursor-pointer hover:bg-muted/50">
											<TableCell>
												<Link
													href={`${basePath}/invoices/${vi.id}`}
													className="font-mono text-sm hover:underline"
												>
													{vi.invoiceNumber}
												</Link>
											</TableCell>
											<TableCell>{vi.vendor?.name ?? "-"}</TableCell>
											<TableCell>
												<div className="flex items-center gap-1 text-red-600">
													<Calendar className="h-3 w-3" />
													{vi.dueDate ? formatDate(new Date(vi.dueDate)) : "-"}
												</div>
											</TableCell>
											<TableCell className="text-end font-semibold text-red-600">
												<Currency amount={vi.remaining} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
