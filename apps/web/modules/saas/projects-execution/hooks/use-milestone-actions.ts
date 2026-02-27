"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function useMilestoneActions(projectId: string) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const invalidateAll = () => {
		queryClient.invalidateQueries({
			queryKey: ["project-timeline", organizationId, projectId],
		});
		queryClient.invalidateQueries({
			queryKey: ["project-timeline-health", organizationId, projectId],
		});
		queryClient.invalidateQueries({
			queryKey: ["project-execution-dashboard", organizationId, projectId],
		});
	};

	const createMutation = useMutation({
		mutationFn: async (data: {
			title: string;
			description?: string;
			plannedStart?: string;
			plannedEnd?: string;
			isCritical?: boolean;
		}) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.createMilestone({
				organizationId,
				projectId,
				...data,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.created"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: {
			milestoneId: string;
			title?: string;
			description?: string;
			plannedStart?: string | null;
			plannedEnd?: string | null;
			isCritical?: boolean;
			status?: string;
		}) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.updateMilestone({
				organizationId,
				projectId,
				...data,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.updated"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const startMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.startMilestone({
				organizationId,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.started"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const completeMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.completeMilestone({
				organizationId,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.completed"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const updateProgressMutation = useMutation({
		mutationFn: async (data: {
			milestoneId: string;
			progress: number;
		}) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.markActual({
				organizationId,
				projectId,
				milestoneId: data.milestoneId,
				progress: data.progress,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.progressUpdated"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (milestoneId: string) => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectTimeline.deleteMilestone({
				organizationId,
				projectId,
				milestoneId,
			});
		},
		onSuccess: () => {
			toast.success(t("timeline.notifications.deleted"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	return {
		createMutation,
		updateMutation,
		startMutation,
		completeMutation,
		updateProgressMutation,
		deleteMutation,
		organizationId,
	};
}
