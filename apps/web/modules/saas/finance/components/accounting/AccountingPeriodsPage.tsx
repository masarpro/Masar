"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Calendar, CheckCircle, CircleDot, Lock, Unlock } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import Link from "next/link";

interface Props {
	organizationId: string;
	organizationSlug: string;
}

export function AccountingPeriodsPage({ organizationId, organizationSlug }: Props) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	const { data: periods, isLoading } = useQuery(
		orpc.accounting.periods.list.queryOptions({
			input: { organizationId, year },
		}),
	);

	const generateMutation = useMutation({
		...orpc.accounting.periods.generate.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting"] }),
	});

	const closeMutation = useMutation({
		...orpc.accounting.periods.close.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting"] }),
	});

	const reopenMutation = useMutation({
		...orpc.accounting.periods.reopen.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting"] }),
	});

	if (isLoading) return <DashboardSkeleton />;

	const periodsList = periods ?? [];

	// Find the oldest open period and the last closed period
	const firstOpenIdx = periodsList.findIndex((p) => !p.isClosed);
	const lastClosedIdx = periodsList.reduce((last, p, i) => (p.isClosed ? i : last), -1);

	return (
		<div className="space-y-4">
			{/* Year selector + Generate */}
			<div className="flex items-center justify-between">
				<div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
					{[currentYear - 1, currentYear, currentYear + 1].map((y) => (
						<Button key={y} variant={year === y ? "default" : "ghost"} size="sm" className="rounded-lg" onClick={() => setYear(y)}>
							{y}
						</Button>
					))}
				</div>
				{periodsList.length === 0 && (
					<Button
						onClick={() => generateMutation.mutate({ organizationId, year })}
						disabled={generateMutation.isPending}
						className="rounded-xl"
					>
						<Calendar className="h-4 w-4 me-2" />
						{t("finance.accounting.periods.generate")}
					</Button>
				)}
			</div>

			{periodsList.length === 0 ? (
				<Card className="rounded-2xl">
					<CardContent className="p-12 text-center text-slate-500">
						{t("finance.accounting.periods.noPeriods") || "لا توجد فترات محاسبية"}
					</CardContent>
				</Card>
			) : (
				<Card className="rounded-2xl">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.accounting.periods.period")}</TableHead>
									<TableHead>{t("finance.accounting.periods.monthly")}</TableHead>
									<TableHead className="text-center">{t("finance.accounting.periods.entriesCount")}</TableHead>
									<TableHead className="text-center">{t("finance.accounting.posted")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.periods.close")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{periodsList.map((period, idx) => {
									const canClose = !period.isClosed && idx === firstOpenIdx;
									const canReopen = period.isClosed && idx === lastClosedIdx;

									return (
										<TableRow key={period.id}>
											<TableCell className="font-medium">{period.name}</TableCell>
											<TableCell className="text-sm text-slate-500">
												{new Date(period.startDate).toLocaleDateString("en-SA")} — {new Date(period.endDate).toLocaleDateString("en-SA")}
											</TableCell>
											<TableCell className="text-center">
												<Link
													href={`/app/${organizationSlug}/finance/journal-entries?dateFrom=${new Date(period.startDate).toISOString()}&dateTo=${new Date(period.endDate).toISOString()}`}
													className="text-primary hover:underline"
												>
													{(period as any).entryCount ?? 0}
												</Link>
											</TableCell>
											<TableCell className="text-center">
												{period.isClosed ? (
													<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
														<CheckCircle className="h-3 w-3 me-1" />
														{t("finance.accounting.periods.closed")}
													</Badge>
												) : (
													<Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
														<CircleDot className="h-3 w-3 me-1" />
														{t("finance.accounting.periods.open")}
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-end">
												{canClose && (
													<Button
														size="sm"
														variant="destructive"
														className="rounded-xl"
														disabled={closeMutation.isPending}
														onClick={() => {
															if (confirm(t("finance.accounting.periods.closingConfirm"))) {
																closeMutation.mutate({ organizationId, id: period.id });
															}
														}}
													>
														<Lock className="h-3 w-3 me-1" />
														{t("finance.accounting.periods.close")}
													</Button>
												)}
												{canReopen && (
													<Button
														size="sm"
														variant="outline"
														className="rounded-xl"
														disabled={reopenMutation.isPending}
														onClick={() => {
															if (confirm(t("finance.accounting.periods.reopen") + "?")) {
																reopenMutation.mutate({ organizationId, id: period.id });
															}
														}}
													>
														<Unlock className="h-3 w-3 me-1" />
														{t("finance.accounting.periods.reopen")}
													</Button>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
