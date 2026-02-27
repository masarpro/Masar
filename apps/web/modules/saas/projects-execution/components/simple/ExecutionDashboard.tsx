"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { AlertTriangleIcon, BarChart3Icon, ClipboardListIcon, GanttChartIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useExecutionData } from "../../hooks/use-execution-data";
import { useMilestoneActions } from "../../hooks/use-milestone-actions";
import type { ExecutionMilestone, ViewMode } from "../../lib/execution-types";
import type { MilestoneTemplate } from "../../lib/execution-types";
import { ConfirmDeleteDialog } from "../shared/ConfirmDeleteDialog";
import { ExecutionViewToggle } from "../shared/ExecutionViewToggle";
import { MilestoneForm } from "../shared/MilestoneForm";
import { EnhancedMilestoneCard } from "./EnhancedMilestoneCard";
import { HealthStatStrip } from "./HealthStatStrip";
import { MilestoneTableView } from "./MilestoneTableView";
import { MilestoneTemplateDialog } from "./MilestoneTemplateDialog";

interface ExecutionDashboardProps {
	projectId: string;
}

export function ExecutionDashboard({ projectId }: ExecutionDashboardProps) {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [view, setView] = useQueryState(
		"view",
		parseAsString.withDefault("cards"),
	);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isTemplateOpen, setIsTemplateOpen] = useState(false);
	const [editingMilestone, setEditingMilestone] = useState<ExecutionMilestone | null>(null);
	const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

	const { milestones, dashboard, isLoading } = useExecutionData(projectId);
	const {
		createMutation,
		updateMutation,
		startMutation,
		completeMutation,
		updateProgressMutation,
		deleteMutation,
	} = useMilestoneActions(projectId);

	// Template application
	const applyTemplateMutation = useMutation({
		mutationFn: async (template: MilestoneTemplate) => {
			if (!organizationId) throw new Error("No organization");

			for (const milestone of template.milestones) {
				const result = await apiClient.projectTimeline.createMilestone({
					organizationId,
					projectId,
					title: milestone.title,
				});

				// Create activities for each milestone
				for (const activityTitle of milestone.activities) {
					await apiClient.projectExecution.createActivity({
						organizationId,
						projectId,
						milestoneId: result.milestone.id,
						title: activityTitle,
					});
				}
			}
		},
		onSuccess: () => {
			toast.success(t("execution.notifications.templateApplied"));
			queryClient.invalidateQueries({
				queryKey: ["project-timeline", organizationId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["project-execution-dashboard", organizationId, projectId],
			});
			setIsTemplateOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleAddMilestone = useCallback(() => {
		if (milestones.length === 0) {
			setIsTemplateOpen(true);
		} else {
			setIsCreateOpen(true);
		}
	}, [milestones.length]);

	const handleCreate = (data: {
		title: string;
		description?: string;
		plannedStart?: string;
		plannedEnd?: string;
		isCritical?: boolean;
	}) => {
		createMutation.mutate(data, {
			onSuccess: () => setIsCreateOpen(false),
		});
	};

	const handleEdit = (data: {
		title: string;
		description?: string;
		plannedStart?: string;
		plannedEnd?: string;
		isCritical?: boolean;
	}) => {
		if (!editingMilestone) return;
		updateMutation.mutate(
			{
				milestoneId: editingMilestone.id,
				...data,
			},
			{
				onSuccess: () => setEditingMilestone(null),
			},
		);
	};

	const handleDelete = () => {
		if (!deletingMilestoneId) return;
		deleteMutation.mutate(deletingMilestoneId, {
			onSuccess: () => setDeletingMilestoneId(null),
		});
	};

	// Loading skeleton
	if (isLoading) {
		return (
			<div className="space-y-6">
				<HealthStatStrip health={null} isLoading />
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			</div>
		);
	}

	// Delayed milestones warning
	const delayedMilestones = milestones.filter(
		(m: any) => m.healthStatus === "DELAYED" && m.status !== "COMPLETED",
	);

	return (
		<div className="space-y-6">
			{/* Health KPI Strip */}
			<HealthStatStrip health={dashboard} />

			{/* Header: View toggle + Add button */}
			<div className="flex items-center justify-between gap-4">
				<ExecutionViewToggle
					view={view as ViewMode}
					onViewChange={setView}
				/>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						asChild
					>
						<Link
							href={`/app/${organizationSlug}/projects/${projectId}/execution/advanced`}
						>
							<GanttChartIcon className="h-4 w-4 me-1" />
							{t("execution.advancedMode")}
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						asChild
					>
						<Link
							href={`/app/${organizationSlug}/projects/${projectId}/execution/lookahead`}
						>
							<ClipboardListIcon className="h-4 w-4 me-1" />
							{t("execution.dashboard.lookahead")}
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						asChild
					>
						<Link
							href={`/app/${organizationSlug}/projects/${projectId}/execution/analysis`}
						>
							<BarChart3Icon className="h-4 w-4 me-1" />
							{t("execution.dashboard.delayAnalysis")}
						</Link>
					</Button>
					<Button size="sm" onClick={handleAddMilestone}>
						<PlusIcon className="h-4 w-4 me-1" />
						{t("timeline.addMilestone")}
					</Button>
				</div>
			</div>

			{/* Delayed warning */}
			{delayedMilestones.length > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
					<AlertTriangleIcon className="h-4 w-4 shrink-0" />
					{t("timeline.delayedWarning", {
						count: delayedMilestones.length,
					})}
				</div>
			)}

			{/* Content */}
			{milestones.length === 0 ? (
				<div className="text-center py-12">
					<h3 className="text-lg font-semibold">
						{t("timeline.emptyTitle")}
					</h3>
					<p className="text-muted-foreground mt-1">
						{t("timeline.emptyDescription")}
					</p>
					<Button className="mt-4" onClick={handleAddMilestone}>
						<PlusIcon className="h-4 w-4 me-1" />
						{t("timeline.addMilestone")}
					</Button>
				</div>
			) : view === "table" ? (
				<MilestoneTableView
					milestones={milestones as ExecutionMilestone[]}
					onEdit={(m) => setEditingMilestone(m)}
					onDelete={(id) => setDeletingMilestoneId(id)}
				/>
			) : (
				<div className="space-y-3">
					{(milestones as ExecutionMilestone[]).map((milestone) => (
						<EnhancedMilestoneCard
							key={milestone.id}
							milestone={milestone}
							projectId={projectId}
							organizationSlug={organizationSlug}
							onStart={() => startMutation.mutate(milestone.id)}
							onComplete={() => completeMutation.mutate(milestone.id)}
							onUpdateProgress={(progress) =>
								updateProgressMutation.mutate({
									milestoneId: milestone.id,
									progress,
								})
							}
							onEdit={() => setEditingMilestone(milestone)}
							onDelete={() => setDeletingMilestoneId(milestone.id)}
							isLoading={
								startMutation.isPending ||
								completeMutation.isPending ||
								updateProgressMutation.isPending
							}
						/>
					))}
				</div>
			)}

			{/* Template dialog */}
			<MilestoneTemplateDialog
				open={isTemplateOpen}
				onOpenChange={setIsTemplateOpen}
				onApply={(template) => applyTemplateMutation.mutate(template)}
				onSkip={() => {
					setIsTemplateOpen(false);
					setIsCreateOpen(true);
				}}
			/>

			{/* Create/Edit form */}
			<MilestoneForm
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onSubmit={handleCreate}
				isLoading={createMutation.isPending}
				mode="create"
			/>

			<MilestoneForm
				open={!!editingMilestone}
				onOpenChange={(open) => {
					if (!open) setEditingMilestone(null);
				}}
				onSubmit={handleEdit}
				isLoading={updateMutation.isPending}
				initialData={
					editingMilestone
						? {
								title: editingMilestone.title,
								plannedStart: editingMilestone.plannedStart,
								plannedEnd: editingMilestone.plannedEnd,
								isCritical: editingMilestone.isCritical,
							}
						: undefined
				}
				mode="edit"
			/>

			{/* Delete confirmation */}
			<ConfirmDeleteDialog
				open={!!deletingMilestoneId}
				onOpenChange={(open) => {
					if (!open) setDeletingMilestoneId(null);
				}}
				onConfirm={handleDelete}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
