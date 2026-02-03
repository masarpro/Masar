"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { PlusIcon, CalendarIcon, AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { MilestoneCard } from "./MilestoneCard";
import { CreateMilestoneForm } from "./CreateMilestoneForm";
import { TimelineHealthBadge } from "./TimelineHealthBadge";

interface TimelineBoardProps {
	projectId: string;
}

export function TimelineBoard({ projectId }: TimelineBoardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingMilestone, setEditingMilestone] = useState<{
		id: string;
		title: string;
		description?: string | null;
		plannedStart?: Date | string | null;
		plannedEnd?: Date | string | null;
		isCritical: boolean;
	} | null>(null);

	const queryKey = ["project-timeline", activeOrganization?.id, projectId];

	// Fetch milestones
	const { data: milestonesData, isLoading: isLoadingMilestones } = useQuery({
		queryKey,
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectTimeline.listMilestones({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch health
	const { data: healthData } = useQuery({
		queryKey: ["project-timeline-health", activeOrganization?.id, projectId],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectTimeline.getHealth({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async (data: {
			title: string;
			description?: string;
			plannedStart?: string;
			plannedEnd?: string;
			isCritical: boolean;
		}) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.createMilestone({
				organizationId: activeOrganization.id,
				projectId,
				title: data.title,
				description: data.description,
				plannedStart: data.plannedStart
					? new Date(data.plannedStart).toISOString()
					: undefined,
				plannedEnd: data.plannedEnd
					? new Date(data.plannedEnd).toISOString()
					: undefined,
				isCritical: data.isCritical,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.created"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
			setIsCreateOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async ({
			milestoneId,
			data,
		}: {
			milestoneId: string;
			data: {
				title?: string;
				description?: string;
				plannedStart?: string;
				plannedEnd?: string;
				isCritical?: boolean;
			};
		}) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.updateMilestone({
				organizationId: activeOrganization.id,
				projectId,
				milestoneId,
				title: data.title,
				description: data.description,
				plannedStart: data.plannedStart
					? new Date(data.plannedStart).toISOString()
					: undefined,
				plannedEnd: data.plannedEnd
					? new Date(data.plannedEnd).toISOString()
					: undefined,
				isCritical: data.isCritical,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.updated"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
			setEditingMilestone(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Start mutation
	const startMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.startMilestone({
				organizationId: activeOrganization.id,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.started"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Complete mutation
	const completeMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.completeMilestone({
				organizationId: activeOrganization.id,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.completed"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Progress mutation
	const progressMutation = useMutation({
		mutationFn: async ({
			milestoneId,
			progress,
		}: {
			milestoneId: string;
			progress: number;
		}) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.markActual({
				organizationId: activeOrganization.id,
				projectId,
				milestoneId,
				progress,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.progressUpdated"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectTimeline.deleteMilestone({
				organizationId: activeOrganization.id,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.deleted"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline-health"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	if (isLoadingMilestones) {
		return (
			<div className="space-y-4">
				<div className="animate-pulse h-24 bg-muted rounded-xl" />
				<div className="animate-pulse h-32 bg-muted rounded-xl" />
				<div className="animate-pulse h-32 bg-muted rounded-xl" />
			</div>
		);
	}

	const milestones = milestonesData?.milestones || [];
	const health = healthData?.health;

	return (
		<div className="space-y-6">
			{/* Health Summary Bar */}
			{health && health.total > 0 && (
				<Card className="p-4">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<CalendarIcon className="h-5 w-5 text-muted-foreground" />
								<span className="font-semibold">
									{t("timeline.healthSummary")}
								</span>
							</div>
							<div className="flex gap-2">
								{health.onTrack > 0 && (
									<TimelineHealthBadge status="ON_TRACK" size="sm" />
								)}
								{health.atRisk > 0 && (
									<div className="flex items-center gap-1">
										<TimelineHealthBadge status="AT_RISK" size="sm" />
										<span className="text-sm font-medium">{health.atRisk}</span>
									</div>
								)}
								{health.delayed > 0 && (
									<div className="flex items-center gap-1">
										<TimelineHealthBadge status="DELAYED" size="sm" />
										<span className="text-sm font-medium">{health.delayed}</span>
									</div>
								)}
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="text-sm">
								<span className="text-muted-foreground">
									{t("timeline.completed")}:
								</span>{" "}
								<span className="font-semibold">
									{health.completed}/{health.total}
								</span>
							</div>
							<div className="w-32">
								<Progress value={health.overallProgress} className="h-2" />
							</div>
							<span className="text-sm font-semibold">
								{health.overallProgress}%
							</span>
						</div>
					</div>
				</Card>
			)}

			{/* Delayed Warning */}
			{health && health.delayed > 0 && (
				<Card className="p-4 border-red-200 bg-red-50">
					<div className="flex items-center gap-2 text-red-700">
						<AlertTriangleIcon className="h-5 w-5" />
						<span className="font-medium">
							{t("timeline.delayedWarning", { count: health.delayed })}
						</span>
					</div>
				</Card>
			)}

			{/* Add Milestone Button */}
			<div className="flex justify-end">
				<Button onClick={() => setIsCreateOpen(true)}>
					<PlusIcon className="h-4 w-4 mr-2" />
					{t("timeline.addMilestone")}
				</Button>
			</div>

			{/* Milestones List */}
			{milestones.length === 0 ? (
				<Card className="p-12 text-center">
					<CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">
						{t("timeline.emptyTitle")}
					</h3>
					<p className="text-muted-foreground mb-4">
						{t("timeline.emptyDescription")}
					</p>
					<Button onClick={() => setIsCreateOpen(true)}>
						<PlusIcon className="h-4 w-4 mr-2" />
						{t("timeline.addMilestone")}
					</Button>
				</Card>
			) : (
				<div className="space-y-4">
					{milestones.map((milestone) => (
						<MilestoneCard
							key={milestone.id}
							milestone={milestone}
							onStart={() => startMutation.mutate(milestone.id)}
							onComplete={() => completeMutation.mutate(milestone.id)}
							onUpdateProgress={(progress) =>
								progressMutation.mutate({
									milestoneId: milestone.id,
									progress,
								})
							}
							onEdit={() => setEditingMilestone(milestone)}
							onDelete={() => {
								if (confirm(t("timeline.confirmDelete"))) {
									deleteMutation.mutate(milestone.id);
								}
							}}
							isLoading={
								startMutation.isPending ||
								completeMutation.isPending ||
								progressMutation.isPending
							}
						/>
					))}
				</div>
			)}

			{/* Create Form */}
			<CreateMilestoneForm
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onSubmit={(data) => createMutation.mutate(data)}
				isLoading={createMutation.isPending}
			/>

			{/* Edit Form */}
			{editingMilestone && (
				<CreateMilestoneForm
					open={true}
					onOpenChange={() => setEditingMilestone(null)}
					onSubmit={(data) =>
						updateMutation.mutate({
							milestoneId: editingMilestone.id,
							data,
						})
					}
					isLoading={updateMutation.isPending}
					editData={editingMilestone}
				/>
			)}
		</div>
	);
}
