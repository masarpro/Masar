"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	ArrowLeft,
	Banknote,
	Calendar,
	Clock,
	FileText,
	Tag,
	User,
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

export default function OwnerChangeOrderDetailPage() {
	const params = useParams();
	const token = params.token as string;
	const changeId = params.changeId as string;
	const t = useTranslations();
	const basePath = `/owner/${token}`;

	const { data: changeOrder, isLoading } = useQuery(
		orpc.projectChangeOrders.ownerGet.queryOptions({
			input: { token, changeOrderId: changeId },
		}),
	);

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

	if (!changeOrder) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<FileText className="h-16 w-16 text-slate-300 dark:text-slate-600" />
				<p className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
					{t("changeOrders.empty.title")}
				</p>
				<Button asChild className="mt-4">
					<Link href={`${basePath}/changes`}>
						{t("changeOrders.actions.backToList")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back Link */}
			<Link
				href={`${basePath}/changes`}
				className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("changeOrders.actions.backToList")}
			</Link>

			{/* Header */}
			<Card className="p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div className="mb-2 flex items-center gap-3">
							<span className="font-mono text-sm text-slate-500">
								CO-{changeOrder.coNo}
							</span>
							{getStatusBadge(changeOrder.status as ChangeOrderStatus, t)}
						</div>
						<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
							{changeOrder.title}
						</h1>
					</div>
					<Badge
						variant="outline"
						className="bg-slate-50 dark:bg-slate-800"
					>
						<Tag className="me-1.5 h-3.5 w-3.5" />
						{t(`changeOrders.category.${changeOrder.category}`)}
					</Badge>
				</div>

				{changeOrder.description && (
					<div className="mt-4 border-t pt-4 dark:border-slate-800">
						<p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
							{changeOrder.description}
						</p>
					</div>
				)}
			</Card>

			{/* Impact Cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card className="p-5">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/50">
							<Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("changeOrders.fields.costImpact")}
							</p>
							{changeOrder.costImpact ? (
								<p
									className={`text-xl font-semibold ${
										Number(changeOrder.costImpact) >= 0
											? "text-emerald-600 dark:text-emerald-400"
											: "text-red-600 dark:text-red-400"
									}`}
								>
									{Number(changeOrder.costImpact) > 0 ? "+" : ""}
									{formatCurrency(Number(changeOrder.costImpact))}
								</p>
							) : (
								<p className="text-lg text-slate-400">
									{t("changeOrders.detail.noImpact")}
								</p>
							)}
						</div>
					</div>
				</Card>

				<Card className="p-5">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/50">
							<Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("changeOrders.fields.timeImpact")}
							</p>
							{changeOrder.timeImpactDays !== null &&
							changeOrder.timeImpactDays !== undefined ? (
								<p
									className={`text-xl font-semibold ${
										changeOrder.timeImpactDays >= 0
											? "text-blue-600 dark:text-blue-400"
											: "text-orange-600 dark:text-orange-400"
									}`}
								>
									{changeOrder.timeImpactDays > 0 ? "+" : ""}
									{changeOrder.timeImpactDays} {t("common.days")}
								</p>
							) : (
								<p className="text-lg text-slate-400">
									{t("changeOrders.detail.noImpact")}
								</p>
							)}
						</div>
					</div>
				</Card>
			</div>

			{/* Timeline */}
			<Card className="p-6">
				<h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">
					{t("changeOrders.detail.timeline")}
				</h3>
				<div className="space-y-4">
					{/* Decision */}
					{changeOrder.decidedAt && (
						<div className="flex items-start gap-3">
							<div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/50">
								<FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="font-medium text-slate-900 dark:text-slate-100">
									{t("changeOrders.status.APPROVED")}
								</p>
								<span className="flex items-center gap-1 text-sm text-slate-500">
									<Calendar className="h-3.5 w-3.5" />
									{new Date(changeOrder.decidedAt).toLocaleDateString("ar-SA")}
								</span>
								{changeOrder.decisionNote && (
									<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
										{changeOrder.decisionNote}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Implementation */}
					{changeOrder.implementedAt && (
						<div className="flex items-start gap-3">
							<div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/50">
								<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="font-medium text-slate-900 dark:text-slate-100">
									{t("changeOrders.status.IMPLEMENTED")}
								</p>
								<span className="flex items-center gap-1 text-sm text-slate-500">
									<Calendar className="h-3.5 w-3.5" />
									{new Date(changeOrder.implementedAt).toLocaleDateString("ar-SA")}
								</span>
							</div>
						</div>
					)}
				</div>
			</Card>

			{/* Linked Milestone */}
			{changeOrder.milestone && (
				<Card className="p-6">
					<h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
						{t("changeOrders.fields.linkedMilestone")}
					</h3>
					<p className="text-slate-700 dark:text-slate-300">
						{changeOrder.milestone.title}
					</p>
				</Card>
			)}
		</div>
	);
}
