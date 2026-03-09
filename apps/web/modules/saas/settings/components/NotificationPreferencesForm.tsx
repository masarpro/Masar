"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Switch } from "@ui/components/switch";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Bell, BellOff, RotateCcw, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferencesFormProps {
	organizationId: string;
}

// Notification types that can be configured
const NOTIFICATION_TYPES = [
	"approvalRequested",
	"approvalDecided",
	"documentCreated",
	"dailyReportCreated",
	"issueCreated",
	"issueCritical",
	"expenseCreated",
	"claimCreated",
	"claimStatusChanged",
	"changeOrderCreated",
	"ownerMessage",
	"teamMemberAdded",
] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Default preferences for reset
const DEFAULT_PREFS: Record<NotificationType, string[]> = {
	approvalRequested: ["IN_APP", "EMAIL"],
	approvalDecided: ["IN_APP"],
	documentCreated: ["IN_APP"],
	dailyReportCreated: ["IN_APP"],
	issueCreated: ["IN_APP"],
	issueCritical: ["IN_APP", "EMAIL"],
	expenseCreated: ["IN_APP"],
	claimCreated: ["IN_APP"],
	claimStatusChanged: ["IN_APP"],
	changeOrderCreated: ["IN_APP"],
	ownerMessage: ["IN_APP"],
	teamMemberAdded: ["IN_APP"],
};

export function NotificationPreferencesForm({
	organizationId,
}: NotificationPreferencesFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data: prefs, isLoading } = useQuery(
		orpc.notifications.preferences.get.queryOptions({
			input: { organizationId },
		}),
	);

	const updateMutation = useMutation({
		mutationFn: async (data: Record<string, unknown>) => {
			return orpcClient.notifications.preferences.update({
				organizationId,
				...data,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.preferences.get.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
			toast.success(t("settings.notifications.updateSuccess"));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const toggleChannel = (
		notificationType: NotificationType,
		channel: "IN_APP" | "EMAIL",
	) => {
		if (!prefs) return;

		const currentChannels = (prefs as Record<string, unknown>)[
			notificationType
		] as string[];
		const hasChannel = currentChannels.includes(channel);

		const newChannels = hasChannel
			? currentChannels.filter((c) => c !== channel)
			: [...currentChannels, channel];

		updateMutation.mutate({ [notificationType]: newChannels });
	};

	const toggleMuteAll = () => {
		if (!prefs) return;
		updateMutation.mutate({ muteAll: !prefs.muteAll });
	};

	const resetToDefaults = () => {
		updateMutation.mutate({
			...DEFAULT_PREFS,
			emailDigest: false,
			muteAll: false,
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4" dir="rtl">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6"
					>
						<div className="h-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!prefs) return null;

	const isMuted = prefs.muteAll;

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header Controls */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
						<Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
							{t("settings.notifications.title")}
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("settings.notifications.description")}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl border-white/20 dark:border-slate-700/30"
						onClick={resetToDefaults}
						disabled={updateMutation.isPending}
					>
						<RotateCcw className="ml-1.5 h-3.5 w-3.5" />
						{t("settings.notifications.resetDefaults")}
					</Button>
					<Button
						variant={isMuted ? "secondary" : "outline"}
						size="sm"
						className={`rounded-xl ${isMuted ? "bg-red-600 hover:bg-red-700 text-white" : "border-white/20 dark:border-slate-700/30"}`}
						onClick={toggleMuteAll}
						disabled={updateMutation.isPending}
					>
						<BellOff className="ml-1.5 h-3.5 w-3.5" />
						{t("settings.notifications.muteAll")}
					</Button>
				</div>
			</div>

			{isMuted && (
				<div className="rounded-xl border border-red-200/50 dark:border-red-800/30 bg-red-50/50 dark:bg-red-950/20 p-4 text-center">
					<p className="text-sm font-medium text-red-700 dark:text-red-300">
						{t("settings.notifications.mutedWarning")}
					</p>
				</div>
			)}

			{/* Preferences Table */}
			<div
				className={`backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden ${isMuted ? "opacity-50 pointer-events-none" : ""}`}
			>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-slate-200/50 dark:border-slate-700/30">
								<th className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300 p-4">
									{t("settings.notifications.notificationType")}
								</th>
								<th className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 p-4 w-32">
									<div className="flex items-center justify-center gap-1.5">
										<Smartphone className="h-4 w-4" />
										{t("settings.notifications.inApp")}
									</div>
								</th>
								<th className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 p-4 w-32">
									<div className="flex items-center justify-center gap-1.5">
										<Mail className="h-4 w-4" />
										{t("settings.notifications.email")}
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{NOTIFICATION_TYPES.map((type) => {
								const channels = (prefs as Record<string, unknown>)[
									type
								] as string[];
								const hasInApp = channels?.includes("IN_APP") ?? true;
								const hasEmail = channels?.includes("EMAIL") ?? false;

								return (
									<tr
										key={type}
										className="border-b border-slate-100/50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
									>
										<td className="p-4">
											<div>
												<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
													{t(
														`settings.notifications.types.${type}.title`,
													)}
												</p>
												<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
													{t(
														`settings.notifications.types.${type}.description`,
													)}
												</p>
											</div>
										</td>
										<td className="p-4 text-center">
											<Switch
												checked={hasInApp}
												onCheckedChange={() =>
													toggleChannel(type, "IN_APP")
												}
												disabled={updateMutation.isPending}
											/>
										</td>
										<td className="p-4 text-center">
											<Switch
												checked={hasEmail}
												onCheckedChange={() =>
													toggleChannel(type, "EMAIL")
												}
												disabled={updateMutation.isPending}
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
