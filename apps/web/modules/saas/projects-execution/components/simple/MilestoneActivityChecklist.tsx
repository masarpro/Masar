"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { CheckSquareIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface MilestoneActivityChecklistProps {
	projectId: string;
	milestoneId: string;
}

export function MilestoneActivityChecklist({
	projectId,
	milestoneId,
}: MilestoneActivityChecklistProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const [newActivityTitle, setNewActivityTitle] = useState("");

	const queryKey = [
		"project-execution-activities",
		organizationId,
		projectId,
		milestoneId,
	];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.listActivities({
				organizationId,
				projectId,
				milestoneId,
			});
		},
		enabled: !!organizationId,
	});

	const createMutation = useMutation({
		mutationFn: async (title: string) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectExecution.createActivity({
				organizationId,
				projectId,
				milestoneId,
				title,
			});
		},
		onSuccess: () => {
			toast.success(t("execution.notifications.activityCreated"));
			queryClient.invalidateQueries({ queryKey });
			setNewActivityTitle("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const updateProgressMutation = useMutation({
		mutationFn: async (data: { activityId: string; progress: number }) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectExecution.updateActivityProgress({
				organizationId,
				projectId,
				activityId: data.activityId,
				progress: data.progress,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-timeline", organizationId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["project-execution-dashboard", organizationId, projectId],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const activities = data?.activities ?? [];

	const statusBadgeClass: Record<string, string> = {
		NOT_STARTED: "bg-slate-100 text-slate-600",
		IN_PROGRESS: "bg-blue-100 text-blue-600",
		COMPLETED: "bg-green-100 text-green-600",
		DELAYED: "bg-red-100 text-red-600",
		ON_HOLD: "bg-yellow-100 text-yellow-600",
		CANCELLED: "bg-gray-100 text-gray-400",
	};

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
				<Loader2Icon className="h-4 w-4 animate-spin" />
				{t("common.loading")}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2 mb-2">
				<CheckSquareIcon className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-medium">
					{t("execution.milestone.activities")}
				</span>
				{activities.length > 0 && (
					<Badge variant="secondary" className="text-xs">
						{t("execution.milestone.activitiesCount", {
							count: activities.length,
						})}
					</Badge>
				)}
			</div>

			{activities.length === 0 ? (
				<p className="text-xs text-muted-foreground ps-6">
					{t("execution.milestone.noActivities")}
				</p>
			) : (
				<div className="space-y-1.5 ps-2">
					{activities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-center gap-2 group"
						>
							<Checkbox
								checked={activity.status === "COMPLETED"}
								onCheckedChange={(checked) => {
									updateProgressMutation.mutate({
										activityId: activity.id,
										progress: checked ? 100 : 0,
									});
								}}
								disabled={updateProgressMutation.isPending}
							/>
							<span
								className={`text-sm flex-1 ${activity.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}
							>
								{activity.title}
							</span>
							{activity.wbsCode && (
								<span className="text-xs text-muted-foreground font-mono">
									{activity.wbsCode}
								</span>
							)}
							<Badge
								variant="secondary"
								className={`text-[10px] ${statusBadgeClass[activity.status] ?? ""}`}
							>
								{t(`execution.activity.status.${activity.status}`)}
							</Badge>
						</div>
					))}
				</div>
			)}

			{/* Inline add activity */}
			<form
				className="flex items-center gap-2 ps-2 pt-1"
				onSubmit={(e) => {
					e.preventDefault();
					if (newActivityTitle.trim()) {
						createMutation.mutate(newActivityTitle.trim());
					}
				}}
			>
				<Input
					value={newActivityTitle}
					onChange={(e) => setNewActivityTitle(e.target.value)}
					placeholder={t("execution.milestone.addActivity")}
					className="h-7 text-sm"
					disabled={createMutation.isPending}
				/>
				<Button
					type="submit"
					size="icon"
					variant="ghost"
					className="h-7 w-7 shrink-0"
					disabled={!newActivityTitle.trim() || createMutation.isPending}
				>
					<PlusIcon className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}
