"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
import { Progress } from "@ui/components/progress";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useGantt } from "../../../hooks/use-gantt-context";
import { formatDateFull, getDurationDays } from "../../../lib/gantt-utils";
import { STATUS_COLORS } from "../../../lib/gantt-constants";
import type { GanttActivityRow, GanttDependency } from "../../../lib/gantt-types";

interface ActivityDetailSheetProps {
	onClose: () => void;
}

export function ActivityDetailSheet({ onClose }: ActivityDetailSheetProps) {
	const t = useTranslations();
	const locale = useLocale();
	const { state, dispatch } = useGantt();
	const params = useParams();
	const projectId = params.projectId as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const queryClient = useQueryClient();

	// Find the selected activity
	const selectedId = state.selectedActivityId;
	let selectedActivity: GanttActivityRow | null = null;
	let parentMilestoneTitle = "";

	if (selectedId) {
		for (const milestone of state.rows) {
			const found = milestone.children.find((a) => a.id === selectedId);
			if (found) {
				selectedActivity = found;
				parentMilestoneTitle = milestone.title;
				break;
			}
		}
	}

	const open = !!selectedActivity;

	// Find dependencies for this activity
	const predecessors = state.dependencies.filter(
		(d) => d.successorId === selectedId,
	);
	const successors = state.dependencies.filter(
		(d) => d.predecessorId === selectedId,
	);

	const isCritical = selectedId
		? state.criticalActivityIds.has(selectedId)
		: false;
	const duration = selectedActivity
		? getDurationDays(selectedActivity.plannedStart, selectedActivity.plannedEnd)
		: null;

	// Fetch checklist for selected activity
	const { data: checklistData } = useQuery({
		queryKey: ["activity-checklist", organizationId, selectedId],
		queryFn: async () => {
			if (!organizationId || !selectedId) return null;
			return apiClient.projectExecution.listChecklists({
				organizationId,
				projectId,
				activityId: selectedId,
			});
		},
		enabled: !!organizationId && !!selectedId,
	});

	const toggleChecklistMutation = useMutation({
		mutationFn: async (params: { checklistItemId: string; isCompleted: boolean }) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.toggleChecklistItem({
				organizationId,
				projectId,
				checklistItemId: params.checklistItemId,
				isCompleted: params.isCompleted,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["activity-checklist", organizationId, selectedId],
			});
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const checklistItems = (checklistData as any)?.items ?? [];

	// Baseline comparison
	const baselineActivity = state.baselineData?.activities.find(
		(a) => a.activityId === selectedId,
	);

	const handleClose = () => {
		dispatch({ type: "SELECT_ACTIVITY", activityId: null });
		onClose();
	};

	return (
		<Sheet open={open} onOpenChange={(o: boolean) => !o && handleClose()}>
			<SheetContent side="left" className="w-[400px] sm:w-[440px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						{selectedActivity?.title}
						{isCritical && (
							<Badge variant="destructive" className="text-[10px]">
								{t("execution.advanced.bar.critical")}
							</Badge>
						)}
					</SheetTitle>
					<SheetDescription>
						{selectedActivity?.wbsCode
							? `${selectedActivity.wbsCode} — ${parentMilestoneTitle}`
							: parentMilestoneTitle || t("execution.advanced.detail.title")}
					</SheetDescription>
				</SheetHeader>

				{selectedActivity && (
					<div className="mt-6 space-y-6">
						{/* Status + Progress */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									{t("execution.table.status")}
								</span>
								<Badge
									style={{
										backgroundColor:
											STATUS_COLORS[selectedActivity.status] ?? "#94a3b8",
										color: "white",
									}}
								>
									{t(
										`execution.activity.status.${selectedActivity.status}`,
									)}
								</Badge>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between text-sm">
									<span>{t("execution.advanced.wbs.progress")}</span>
									<span className="font-medium">
										{selectedActivity.progress}%
									</span>
								</div>
								<Progress value={selectedActivity.progress} className="h-2" />
							</div>
						</div>

						{/* Schedule */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium">
								{t("execution.advanced.detail.schedule")}
							</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-muted-foreground">
										{t("execution.advanced.wbs.start")}
									</span>
									<div>
										{formatDateFull(selectedActivity.plannedStart, locale)}
									</div>
								</div>
								<div>
									<span className="text-muted-foreground">
										{t("execution.advanced.wbs.end")}
									</span>
									<div>
										{formatDateFull(selectedActivity.plannedEnd, locale)}
									</div>
								</div>
								<div>
									<span className="text-muted-foreground">
										{t("execution.advanced.wbs.duration")}
									</span>
									<div>
										{duration !== null
											? t("execution.advanced.wbs.days", { days: duration })
											: "-"}
									</div>
								</div>
								{selectedActivity.assignee && (
									<div>
										<span className="text-muted-foreground">
											{t("execution.activity.assignee")}
										</span>
										<div>{selectedActivity.assignee.name}</div>
									</div>
								)}
							</div>
						</div>

						{/* Baseline comparison */}
						{state.showBaseline && baselineActivity && (
							<div className="space-y-2">
								<h4 className="text-sm font-medium">
									{t("execution.advanced.detail.baselineComparison")}
								</h4>
								<div className="rounded-md border p-3 space-y-2 text-sm">
									<div className="grid grid-cols-2 gap-2">
										<div>
											<span className="text-muted-foreground text-xs">
												{t("execution.advanced.detail.baselineStart")}
											</span>
											<div>
												{formatDateFull(baselineActivity.plannedStart, locale)}
											</div>
										</div>
										<div>
											<span className="text-muted-foreground text-xs">
												{t("execution.advanced.detail.baselineEnd")}
											</span>
											<div>
												{formatDateFull(baselineActivity.plannedEnd, locale)}
											</div>
										</div>
									</div>
									{selectedActivity.plannedStart &&
										baselineActivity.plannedStart && (
											<div className="text-xs">
												{(() => {
													const current = new Date(
														selectedActivity.plannedStart,
													).getTime();
													const baseline = new Date(
														baselineActivity.plannedStart,
													).getTime();
													const diffDays = Math.round(
														(current - baseline) / (1000 * 60 * 60 * 24),
													);
													if (diffDays === 0) return null;
													return (
														<Badge
															variant={diffDays > 0 ? "destructive" : "outline"}
															className="text-[10px]"
														>
															{diffDays > 0 ? "+" : ""}
															{diffDays}{" "}
															{t("execution.advanced.detail.daysVariance")}
														</Badge>
													);
												})()}
											</div>
										)}
								</div>
							</div>
						)}

						{/* Dependencies */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium">
								{t("execution.advanced.detail.dependencies")}
							</h4>

							{predecessors.length > 0 && (
								<div>
									<span className="text-xs text-muted-foreground">
										{t("execution.advanced.detail.predecessors")}
									</span>
									<div className="mt-1 space-y-1">
										{predecessors.map((dep) => (
											<DependencyBadge
												key={dep.id}
												dependency={dep}
												activityId={dep.predecessorId}
											/>
										))}
									</div>
								</div>
							)}

							{successors.length > 0 && (
								<div>
									<span className="text-xs text-muted-foreground">
										{t("execution.advanced.detail.successors")}
									</span>
									<div className="mt-1 space-y-1">
										{successors.map((dep) => (
											<DependencyBadge
												key={dep.id}
												dependency={dep}
												activityId={dep.successorId}
											/>
										))}
									</div>
								</div>
							)}

							{predecessors.length === 0 && successors.length === 0 && (
								<p className="text-sm text-muted-foreground">
									{t("execution.advanced.detail.noDependencies")}
								</p>
							)}
						</div>

						{/* Checklist */}
						{checklistItems.length > 0 && (
							<div className="space-y-2">
								<h4 className="text-sm font-medium">
									{t("execution.advanced.detail.checklist")}
								</h4>
								<div className="space-y-1.5">
									{checklistItems.map((item: any) => (
										<label
											key={item.id}
											className="flex items-center gap-2 text-sm cursor-pointer"
										>
											<Checkbox
												checked={item.isCompleted}
												onCheckedChange={(checked: boolean | "indeterminate") =>
													toggleChecklistMutation.mutate({
														checklistItemId: item.id,
														isCompleted: !!checked,
													})
												}
											/>
											<span
												className={
													item.isCompleted
														? "line-through text-muted-foreground"
														: ""
												}
											>
												{item.title}
											</span>
										</label>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function DependencyBadge({
	dependency,
	activityId,
}: {
	dependency: GanttDependency;
	activityId: string;
}) {
	const t = useTranslations();
	const { state } = useGantt();

	// Find activity name
	let name = activityId;
	for (const m of state.rows) {
		const a = m.children.find((c) => c.id === activityId);
		if (a) {
			name = a.title;
			break;
		}
	}

	return (
		<div className="flex items-center gap-2 text-sm rounded border px-2 py-1">
			<span className="truncate flex-1">{name}</span>
			<Badge variant="outline" className="text-[10px] shrink-0">
				{t(`execution.dependency.types.${dependency.type}`)}
			</Badge>
			{dependency.lag !== 0 && (
				<span className="text-xs text-muted-foreground">
					{dependency.lag > 0 ? "+" : ""}
					{dependency.lag}d
				</span>
			)}
		</div>
	);
}
