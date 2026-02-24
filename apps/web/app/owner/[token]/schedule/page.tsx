"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import {
	CheckCircle,
	Circle,
	Clock,
	Calendar,
	AlertTriangle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

function getDaysDelay(plannedDate: Date | null, actualDate: Date | null): number | null {
	if (!plannedDate) return null;
	const compareDate = actualDate ? new Date(actualDate) : new Date();
	const planned = new Date(plannedDate);
	const diff = compareDate.getTime() - planned.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OwnerPortalSchedule() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getSchedule.queryOptions({
			input: { token },
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

	if (!data) {
		return null;
	}

	const { projectName, startDate, endDate, milestones } = data;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
					{t("ownerPortal.schedule.title")}
				</h2>
				<div className="flex flex-wrap gap-6 text-sm">
					{startDate && (
						<div className="flex items-center gap-2 text-slate-500">
							<Calendar className="h-4 w-4" />
							<span>{t("ownerPortal.schedule.startDate")}:</span>
							<span className="font-medium text-slate-900 dark:text-slate-100">
								{new Date(startDate).toLocaleDateString("ar-SA")}
							</span>
						</div>
					)}
					{endDate && (
						<div className="flex items-center gap-2 text-slate-500">
							<Calendar className="h-4 w-4" />
							<span>{t("ownerPortal.schedule.endDate")}:</span>
							<span className="font-medium text-slate-900 dark:text-slate-100">
								{new Date(endDate).toLocaleDateString("ar-SA")}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Milestones */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
					{t("ownerPortal.schedule.milestones")}
				</h3>

				{milestones.length === 0 ? (
					<p className="text-center text-slate-500 py-8">
						{t("ownerPortal.schedule.noMilestones")}
					</p>
				) : (
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute start-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

						<div className="space-y-6">
							{milestones.map((milestone, index) => {
								const daysDelay = getDaysDelay(milestone.plannedDate, milestone.actualDate);
								const isDelayed = daysDelay !== null && daysDelay > 0 && !milestone.isCompleted;

								return (
									<div key={milestone.id} className="relative flex gap-4">
										{/* Status icon */}
										<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900">
											{milestone.isCompleted ? (
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
													<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
												</div>
											) : isDelayed ? (
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
													<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
												</div>
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
													<Circle className="h-5 w-5 text-slate-400" />
												</div>
											)}
										</div>

										{/* Content */}
										<div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
											<div className="flex items-start justify-between gap-2">
												<div>
													<h4 className="font-medium text-slate-900 dark:text-slate-100">
														{milestone.title}
													</h4>
													{milestone.description && (
														<p className="mt-1 text-sm text-slate-500">
															{milestone.description}
														</p>
													)}
												</div>
												{milestone.isCompleted ? (
													<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
														{t("ownerPortal.schedule.completed")}
													</Badge>
												) : isDelayed ? (
													<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
														{t("ownerPortal.schedule.delayed")} ({daysDelay} {t("ownerPortal.schedule.days")})
													</Badge>
												) : (
													<Badge className="border-0 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
														{t("ownerPortal.schedule.pending")}
													</Badge>
												)}
											</div>

											<div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
												{milestone.plannedDate && (
													<div className="flex items-center gap-1">
														<Clock className="h-3.5 w-3.5" />
														<span>{t("ownerPortal.schedule.planned")}:</span>
														<span>
															{new Date(milestone.plannedDate).toLocaleDateString("ar-SA")}
														</span>
													</div>
												)}
												{milestone.actualDate && (
													<div className="flex items-center gap-1">
														<CheckCircle className="h-3.5 w-3.5 text-green-500" />
														<span>{t("ownerPortal.schedule.actual")}:</span>
														<span>
															{new Date(milestone.actualDate).toLocaleDateString("ar-SA")}
														</span>
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
