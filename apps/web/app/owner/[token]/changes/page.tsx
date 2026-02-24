"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Card } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	FileTextIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ClockIcon,
	DollarSignIcon,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type ChangeOrderStatus = "APPROVED" | "IMPLEMENTED";
type ChangeOrderCategory =
	| "SCOPE_CHANGE"
	| "CLIENT_REQUEST"
	| "SITE_CONDITION"
	| "DESIGN_CHANGE"
	| "MATERIAL_CHANGE"
	| "REGULATORY"
	| "OTHER";

interface OwnerChangeOrder {
	id: string;
	coNo: number;
	title: string;
	description?: string | null;
	category: ChangeOrderCategory;
	status: ChangeOrderStatus;
	costImpact?: string | null;
	timeImpactDays?: number | null;
	decisionAt?: string | null;
	implementedAt?: string | null;
}

function formatCurrency(value: number | string | null | undefined): string {
	if (value === null || value === undefined) return "-";
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (Number.isNaN(num)) return "-";
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);
}

function getStatusBadge(status: ChangeOrderStatus, t: (key: string) => string) {
	const colors: Record<ChangeOrderStatus, string> = {
		APPROVED:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
		IMPLEMENTED:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	};

	return (
		<Badge className={`border-0 ${colors[status]}`}>
			{t(`changeOrders.status.${status}`)}
		</Badge>
	);
}

export default function OwnerChangeOrdersPage() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const basePath = `/owner/${token}`;

	const { data, isLoading } = useQuery(
		orpc.projectChangeOrders.ownerList.queryOptions({
			input: { token },
		}),
	);

	const changeOrders = (data?.changeOrders ?? []) as OwnerChangeOrder[];

	// Calculate stats
	const stats = {
		total: changeOrders.length,
		implemented: changeOrders.filter((co) => co.status === "IMPLEMENTED").length,
		totalCostImpact: changeOrders.reduce((sum, co) => {
			if (co.costImpact) {
				return sum + Number.parseFloat(co.costImpact);
			}
			return sum;
		}, 0),
		totalTimeImpact: changeOrders.reduce((sum, co) => {
			if (co.timeImpactDays !== null && co.timeImpactDays !== undefined) {
				return sum + co.timeImpactDays;
			}
			return sum;
		}, 0),
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
					{t("changeOrders.ownerPortal.title")}
				</h2>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{t("changeOrders.ownerPortal.subtitle")}
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Card className="p-4">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
							<FileTextIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t("changeOrders.stats.total")}
							</p>
							<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
								{stats.total}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
							<ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-xs text-blue-600 dark:text-blue-400">
								{t("changeOrders.status.IMPLEMENTED")}
							</p>
							<p className="text-xl font-semibold text-blue-700 dark:text-blue-300">
								{stats.implemented}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
							<DollarSignIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<p className="text-xs text-emerald-600 dark:text-emerald-400">
								{t("changeOrders.stats.costImpact")}
							</p>
							<p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
								{formatCurrency(stats.totalCostImpact)}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
							{stats.totalTimeImpact >= 0 ? (
								<TrendingUpIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							) : (
								<TrendingDownIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							)}
						</div>
						<div>
							<p className="text-xs text-amber-600 dark:text-amber-400">
								{t("changeOrders.stats.timeImpact")}
							</p>
							<p className="text-xl font-semibold text-amber-700 dark:text-amber-300">
								{stats.totalTimeImpact > 0 ? "+" : ""}
								{stats.totalTimeImpact} {t("common.days")}
							</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Change Orders Table */}
			<Card>
				{changeOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<FileTextIcon className="h-16 w-16 text-slate-300 dark:text-slate-600" />
						<p className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
							{t("changeOrders.empty.title")}
						</p>
						<p className="mt-1 text-slate-500 dark:text-slate-400">
							{t("changeOrders.empty.description")}
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">#</TableHead>
								<TableHead>{t("changeOrders.fields.title")}</TableHead>
								<TableHead>{t("changeOrders.fields.category")}</TableHead>
								<TableHead className="text-center">
									{t("changeOrders.fields.costImpact")}
								</TableHead>
								<TableHead className="text-center">
									{t("changeOrders.fields.timeImpact")}
								</TableHead>
								<TableHead>{t("changeOrders.fields.status")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{changeOrders.map((co) => (
								<TableRow key={co.id} className="group">
									<TableCell className="font-mono text-sm text-slate-500">
										CO-{co.coNo}
									</TableCell>
									<TableCell>
										<Link
											href={`${basePath}/changes/${co.id}`}
											className="font-medium text-slate-900 hover:text-primary dark:text-slate-100"
										>
											{co.title}
										</Link>
									</TableCell>
									<TableCell className="text-sm text-slate-600 dark:text-slate-400">
										{t(`changeOrders.category.${co.category}`)}
									</TableCell>
									<TableCell className="text-center">
										{co.costImpact ? (
											<span
												className={
													Number(co.costImpact) >= 0
														? "text-emerald-600 dark:text-emerald-400"
														: "text-red-600 dark:text-red-400"
												}
											>
												{Number(co.costImpact) > 0 ? "+" : ""}
												{formatCurrency(co.costImpact)}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell className="text-center">
										{co.timeImpactDays !== null &&
										co.timeImpactDays !== undefined ? (
											<span
												className={
													co.timeImpactDays >= 0
														? "text-blue-600 dark:text-blue-400"
														: "text-orange-600 dark:text-orange-400"
												}
											>
												{co.timeImpactDays > 0 ? "+" : ""}
												{co.timeImpactDays} {t("common.days")}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>{getStatusBadge(co.status, t)}</TableCell>
									<TableCell>
										<Link
											href={`${basePath}/changes/${co.id}`}
											className="text-slate-400 transition-colors group-hover:text-primary"
										>
											<ChevronRight className="h-4 w-4" />
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>
		</div>
	);
}
