"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export function useExecutionData(projectId: string) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const milestonesQueryKey = [
		"project-timeline",
		organizationId,
		projectId,
	];

	const healthQueryKey = [
		"project-timeline-health",
		organizationId,
		projectId,
	];

	const dashboardQueryKey = [
		"project-execution-dashboard",
		organizationId,
		projectId,
	];

	const {
		data: milestonesData,
		isLoading: isLoadingMilestones,
	} = useQuery({
		queryKey: milestonesQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectTimeline.listMilestones({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: healthData, isLoading: isLoadingHealth } = useQuery({
		queryKey: healthQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectTimeline.getHealth({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
		queryKey: dashboardQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getDashboard({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	return {
		milestones: milestonesData?.milestones ?? [],
		health: healthData,
		dashboard: dashboardData?.dashboard ?? null,
		isLoading: isLoadingMilestones || isLoadingHealth || isLoadingDashboard,
		milestonesQueryKey,
		healthQueryKey,
		dashboardQueryKey,
		organizationId,
	};
}

export function useActivities(projectId: string, milestoneId?: string) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

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
		enabled: !!organizationId && !!milestoneId,
	});

	return {
		activities: data?.activities ?? [],
		isLoading,
		queryKey,
		organizationId,
	};
}
