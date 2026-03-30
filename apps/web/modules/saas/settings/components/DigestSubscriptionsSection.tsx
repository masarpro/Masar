"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@ui/components/switch";
import { Badge } from "@ui/components/badge";
import { Mail, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface DigestSubscriptionsSectionProps {
	organizationId: string;
}

export function DigestSubscriptionsSection({
	organizationId,
}: DigestSubscriptionsSectionProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		orpc.digests.listSubscriptions.queryOptions({
			input: { organizationId },
		}),
	);

	const subscribeMutation = useMutation({
		mutationFn: async ({
			projectId,
		}: { projectId?: string }) => {
			return orpcClient.digests.subscribe({
				organizationId,
				projectId,
				frequency: "WEEKLY",
				channel: "EMAIL",
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.digests.listSubscriptions.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
			toast.success(t("settings.digests.toastSubscribed"));
		},
		onError: (error: Error) => {
			toast.error(error.message || t("settings.digests.toastError"));
		},
	});

	const unsubscribeMutation = useMutation({
		mutationFn: async ({
			projectId,
		}: { projectId?: string }) => {
			return orpcClient.digests.unsubscribe({
				organizationId,
				projectId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.digests.listSubscriptions.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
			toast.success(t("settings.digests.toastUnsubscribed"));
		},
		onError: (error: Error) => {
			toast.error(error.message || t("settings.digests.toastError"));
		},
	});

	const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;

	const subscriptions = ((data as Record<string, unknown>)?.subscriptions ?? []) as Array<{
		projectId: string | null;
		project?: { name: string } | null;
		isEnabled: boolean;
	}>;

	const isSubscribed = (projectId?: string) => {
		return subscriptions.some(
			(sub: { projectId: string | null; isEnabled: boolean }) =>
				sub.projectId === (projectId ?? null) && sub.isEnabled,
		);
	};

	const handleToggle = (projectId?: string) => {
		if (isSubscribed(projectId)) {
			unsubscribeMutation.mutate({ projectId });
		} else {
			subscribeMutation.mutate({ projectId });
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4" dir="rtl">
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
					<div className="h-24 animate-pulse rounded bg-muted" />
				</div>
			</div>
		);
	}

	// Get unique projects from subscriptions
	const projects = subscriptions
		.filter((sub: { projectId: string | null; project?: { name: string } | null }) => sub.projectId && sub.project)
		.map((sub: { projectId: string | null; project?: { name: string } | null }) => ({
			id: sub.projectId!,
			name: sub.project?.name ?? sub.projectId!,
		}));

	// Remove duplicates
	const uniqueProjects = Array.from(
		new Map(projects.map((p: { id: string; name: string }) => [p.id, p])).values(),
	);

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
					<Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						{t("settings.digests.title")}
					</h2>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("settings.digests.description")}
					</p>
				</div>
			</div>

			{/* Subscriptions List */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
					{/* All Projects */}
					<div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
						<div className="flex items-center gap-3">
							<FolderKanban className="h-4 w-4 text-slate-400" />
							<div>
								<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
									{t("settings.digests.allProjects")}
								</p>
								<p className="text-xs text-slate-500">
									{t("settings.digests.weeklyDigest")}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{isSubscribed(undefined) && (
								<Badge variant="secondary" className="text-xs">
									{t("settings.digests.subscribed")}
								</Badge>
							)}
							<Switch
								checked={isSubscribed(undefined)}
								onCheckedChange={() => handleToggle(undefined)}
								disabled={isPending}
							/>
						</div>
					</div>

					{/* Per-Project Subscriptions */}
					{uniqueProjects.map((project) => (
						<div
							key={project.id}
							className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
						>
							<div className="flex items-center gap-3">
								<FolderKanban className="h-4 w-4 text-slate-400" />
								<div>
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										{project.name}
									</p>
									<p className="text-xs text-slate-500">
										{t("settings.digests.weeklyDigest")}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{isSubscribed(project.id) && (
									<Badge variant="secondary" className="text-xs">
										{t("settings.digests.subscribed")}
									</Badge>
								)}
								<Switch
									checked={isSubscribed(project.id)}
									onCheckedChange={() => handleToggle(project.id)}
									disabled={isPending}
								/>
							</div>
						</div>
					))}

					{uniqueProjects.length === 0 && !isSubscribed(undefined) && (
						<div className="p-8 text-center">
							<Mail className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("settings.digests.noSubscriptions")}
							</p>
							<p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
								{t("settings.digests.noSubscriptionsDescription")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
