"use client";

import { GanttPrintCanvas } from "@saas/projects-execution/components/print/GanttPrintCanvas";
import {
	OwnerMilestoneTable,
	type OwnerMilestone,
} from "@saas/projects-owner/components/OwnerMilestoneTable";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Skeleton } from "@ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { BarChart3, Calendar, PrinterIcon, Table2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function OwnerPortalSchedule() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.getSchedule.queryOptions({
			input: { token },
		}),
	) as { data: any; isLoading: boolean };

	const openPrint = (kind: "table" | "gantt") => {
		window.open(`/owner/${token}/print/${kind}?autoprint=1`, "_blank");
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-28 w-full rounded-2xl" />
				<Skeleton className="h-96 w-full rounded-2xl" />
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const { startDate, endDate, milestones } = data as {
		startDate: string | null;
		endDate: string | null;
		milestones: OwnerMilestone[];
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.schedule.title")}
					</h2>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => openPrint("table")}
						>
							<PrinterIcon className="h-4 w-4 me-2" />
							{t("ownerPortal.schedule.printTable")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => openPrint("gantt")}
						>
							<PrinterIcon className="h-4 w-4 me-2" />
							{t("ownerPortal.schedule.printGantt")}
						</Button>
					</div>
				</div>
				<div className="mt-4 flex flex-wrap gap-6 text-sm">
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

			{/* Tabs: table + gantt */}
			<div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
				<Tabs defaultValue="table">
					<TabsList className="mb-4 w-full justify-start gap-4">
						<TabsTrigger value="table">
							<Table2 className="h-4 w-4 me-2" />
							{t("ownerPortal.schedule.tableTab")}
						</TabsTrigger>
						<TabsTrigger value="gantt">
							<BarChart3 className="h-4 w-4 me-2" />
							{t("ownerPortal.schedule.ganttTab")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="table">
						<OwnerMilestoneTable milestones={milestones} />
					</TabsContent>

					<TabsContent value="gantt">
						<div className="overflow-x-auto">
							<div className="min-w-[640px]">
								<GanttPrintCanvas
									milestones={milestones.map((m) => ({
										id: m.id,
										title: m.title,
										plannedStart: m.plannedStart,
										plannedEnd: m.plannedEnd,
										status: m.status,
										progress: Number(m.progress) || 0,
										isCritical: m.isCritical,
									}))}
									projectStart={startDate}
									projectEnd={endDate}
								/>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
