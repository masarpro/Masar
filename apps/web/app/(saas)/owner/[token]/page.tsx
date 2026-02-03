"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	Banknote,
	Calendar,
	Clock,
	MapPin,
	TrendingUp,
	User,
	FileText,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "ACTIVE":
			return (
				<Badge className="border-0 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
					{t("projects.status.ACTIVE")}
				</Badge>
			);
		case "ON_HOLD":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					{t("projects.status.ON_HOLD")}
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
					{t("projects.status.COMPLETED")}
				</Badge>
			);
		default:
			return null;
	}
}

function calculateDaysRemaining(endDate: Date | null): number | null {
	if (!endDate) return null;
	const end = new Date(endDate);
	const today = new Date();
	const diff = end.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OwnerPortalSummary() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getSummary.queryOptions({
			input: { token },
		}),
	);

	if (isLoading || !data?.project) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const { project, currentPhase, latestOfficialUpdate, upcomingPayment } = data;
	const daysRemaining = calculateDaysRemaining(project.endDate);

	return (
		<div className="space-y-6">
			{/* Project Info */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
								{project.name}
							</h2>
							{getStatusBadge(project.status, t)}
						</div>
						<div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
							{project.clientName && (
								<div className="flex items-center gap-1.5">
									<User className="h-4 w-4" />
									<span>{project.clientName}</span>
								</div>
							)}
							{project.location && (
								<div className="flex items-center gap-1.5">
									<MapPin className="h-4 w-4" />
									<span>{project.location}</span>
								</div>
							)}
						</div>
					</div>
					{currentPhase && (
						<Badge className="border-0 bg-primary/10 text-primary">
							{t("ownerPortal.currentPhase")}: {currentPhase}
						</Badge>
					)}
				</div>
			</div>

			{/* Progress Section */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.progress")}
					</h3>
					<span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
						{Math.round(project.progress)}%
					</span>
				</div>
				<Progress value={project.progress} className="h-3" />
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="rounded-2xl bg-teal-50 p-5 dark:bg-teal-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-900/50">
							<TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
						</div>
						<div>
							<p className="text-xs text-teal-600 dark:text-teal-400">
								{t("ownerPortal.progress")}
							</p>
							<p className="text-xl font-semibold text-teal-700 dark:text-teal-300">
								{Math.round(project.progress)}%
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
							<Banknote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<div>
							<p className="text-xs text-indigo-600 dark:text-indigo-400">
								{t("ownerPortal.contractValue")}
							</p>
							<p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
								{project.contractValue
									? formatCurrency(Number(project.contractValue))
									: "-"}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
							<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div>
							<p className="text-xs text-amber-600 dark:text-amber-400">
								{t("ownerPortal.daysRemaining")}
							</p>
							<p className="text-xl font-semibold text-amber-700 dark:text-amber-300">
								{daysRemaining !== null ? daysRemaining : "-"}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
							<Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t("ownerPortal.deliveryDate")}
							</p>
							<p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
								{project.endDate
									? new Date(project.endDate).toLocaleDateString("ar-SA")
									: "-"}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Latest Official Update */}
			{latestOfficialUpdate && (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							<FileText className="inline h-5 w-5 me-2 text-slate-400" />
							{t("ownerPortal.latestUpdate")}
						</h3>
						<span className="text-xs text-slate-500">
							{new Date(latestOfficialUpdate.createdAt).toLocaleDateString("ar-SA")}
						</span>
					</div>
					<p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{latestOfficialUpdate.content}
					</p>
					<p className="mt-2 text-sm text-slate-500">
						— {latestOfficialUpdate.sender.name}
					</p>
				</div>
			)}

			{/* Upcoming Payment */}
			{upcomingPayment && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-amber-800 dark:text-amber-300">
								{t("ownerPortal.nextPayment")}
							</h3>
							<p className="text-sm text-amber-600 dark:text-amber-400">
								{t("ownerPortal.claimNo")} #{upcomingPayment.claimNo}
							</p>
						</div>
						<div className="text-end">
							<p className="text-xl font-bold text-amber-800 dark:text-amber-300">
								{formatCurrency(Number(upcomingPayment.amount))}
							</p>
							{upcomingPayment.dueDate && (
								<p className="text-sm text-amber-600 dark:text-amber-400">
									{new Date(upcomingPayment.dueDate).toLocaleDateString("ar-SA")}
								</p>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
