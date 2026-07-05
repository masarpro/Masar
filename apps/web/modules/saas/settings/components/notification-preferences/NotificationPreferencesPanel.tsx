"use client";

import {
	eventLeafName,
	type NotificationEventChannel,
	type NotificationEventDef,
} from "@repo/database/prisma/notification-registry";
import { getModuleIcon } from "@saas/notifications/lib/notification-icons";
import { useVisibleNotificationGroups } from "@saas/notifications/lib/use-visible-notification-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import { Switch } from "@ui/components/switch";
import {
	AlertCircle,
	Bell,
	BellOff,
	Mail,
	RotateCcw,
	Search,
	Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NotificationEventRow } from "./NotificationEventRow";

interface NotificationPreferencesPanelProps {
	organizationId: string;
}

interface NotificationPreferencesData {
	muteAll: boolean;
	emailDigest: boolean;
	events: Record<string, NotificationEventChannel[]>;
}

interface UpdatePreferencesInput {
	organizationId: string;
	muteAll?: boolean;
	emailDigest?: boolean;
	events?: Record<string, NotificationEventChannel[]>;
	reset?: boolean;
}

/** القنوات المفعّلة عند تشغيل مفتاح المجموعة — افتراضي السجل أو IN_APP إن كان فارغاً */
function groupOnChannels(
	event: NotificationEventDef,
): NotificationEventChannel[] {
	return event.defaultChannels.length > 0
		? [...event.defaultChannels]
		: ["IN_APP"];
}

export function NotificationPreferencesPanel({
	organizationId,
}: NotificationPreferencesPanelProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [openModules, setOpenModules] = useState<string[]>([]);

	const { groups, isLoading: groupsLoading } = useVisibleNotificationGroups();

	const prefsQueryOptions = orpc.notifications.preferences.get.queryOptions({
		input: { organizationId },
	});
	const prefsQueryKey = prefsQueryOptions.queryKey;

	const {
		data: prefs,
		isLoading,
		isError,
		refetch,
	} = useQuery(prefsQueryOptions);

	const updateMutation = useMutation(
		orpc.notifications.preferences.update.mutationOptions({
			onMutate: async (variables: UpdatePreferencesInput) => {
				await queryClient.cancelQueries({ queryKey: prefsQueryKey });
				const previous = queryClient.getQueryData(prefsQueryKey);

				queryClient.setQueryData(prefsQueryKey, (old) => {
					if (!old) {
						return old;
					}
					const current = old as NotificationPreferencesData;
					return {
						...current,
						...(variables.muteAll !== undefined
							? { muteAll: variables.muteAll }
							: {}),
						...(variables.emailDigest !== undefined
							? { emailDigest: variables.emailDigest }
							: {}),
						...(variables.reset ? { muteAll: false } : {}),
						events: variables.reset
							? current.events
							: {
									...current.events,
									...(variables.events ?? {}),
								},
					};
				});

				return { previous };
			},
			onError: (error: Error, _variables, context) => {
				const ctx = context as
					| { previous?: NotificationPreferencesData }
					| undefined;
				if (ctx?.previous !== undefined) {
					queryClient.setQueryData(prefsQueryKey, ctx.previous);
				}
				toast.error(error.message);
			},
			onSuccess: () => {
				toast.success(t("settings.notifications.updateSuccess"));
			},
			onSettled: () => {
				queryClient.invalidateQueries({ queryKey: prefsQueryKey });
			},
		}),
	);

	const events = (prefs?.events ?? {}) as Record<
		string,
		NotificationEventChannel[]
	>;
	const isMuted = prefs?.muteAll ?? false;
	const isPending = updateMutation.isPending;

	const toggleEventChannel = (
		eventKey: string,
		channel: NotificationEventChannel,
	) => {
		const current = events[eventKey] ?? [];
		const next = current.includes(channel)
			? current.filter((c) => c !== channel)
			: [...current, channel];
		updateMutation.mutate({
			organizationId,
			events: { [eventKey]: next },
		});
	};

	const toggleGroup = (
		groupEvents: NotificationEventDef[],
		enabled: boolean,
	) => {
		const changes: Record<string, NotificationEventChannel[]> = {};
		for (const event of groupEvents) {
			changes[event.key] = enabled ? groupOnChannels(event) : [];
		}
		updateMutation.mutate({ organizationId, events: changes });
	};

	const handleReset = () => {
		if (!window.confirm(t("settings.notifications.resetConfirm"))) {
			return;
		}
		updateMutation.mutate({ organizationId, reset: true });
	};

	// فلترة البحث على عنوان الحدث المترجم
	const searchTerm = search.trim().toLowerCase();
	const filteredGroups = useMemo(() => {
		if (!searchTerm) {
			return groups;
		}
		return groups
			.map((group) => ({
				...group,
				events: group.events.filter((event) => {
					const leaf = eventLeafName(event.key);
					const title = t(
						`notifications.events.${event.module}.${leaf}.title`,
					);
					const description = t(
						`notifications.events.${event.module}.${leaf}.description`,
					);
					return (
						title.toLowerCase().includes(searchTerm) ||
						description.toLowerCase().includes(searchTerm)
					);
				}),
			}))
			.filter((group) => group.events.length > 0);
	}, [groups, searchTerm, t]);

	const isSearching = searchTerm.length > 0;
	const accordionValue = isSearching
		? filteredGroups.map((group) => group.key as string)
		: openModules;

	if (isLoading || groupsLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-9 w-48" />
				</div>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-2xl" />
				))}
			</div>
		);
	}

	if (isError || !prefs) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
				<AlertCircle className="mb-3 h-8 w-8 text-slate-400" />
				<p className="mb-4 text-sm text-slate-500">
					{t("settings.notifications.loadError")}
				</p>
				<Button variant="outline" size="sm" onClick={() => refetch()}>
					{t("settings.notifications.retry")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
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
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={handleReset}
						disabled={isPending}
					>
						<RotateCcw className="me-1.5 h-3.5 w-3.5" />
						{t("settings.notifications.resetDefaults")}
					</Button>
					<div className="flex items-center gap-2">
						<BellOff className="h-4 w-4 text-slate-500" />
						<span className="text-sm text-slate-700 dark:text-slate-300">
							{t("settings.notifications.muteAll")}
						</span>
						<Switch
							checked={isMuted}
							onCheckedChange={(checked: boolean) => {
								updateMutation.mutate({
									organizationId,
									muteAll: checked,
								});
							}}
							disabled={isPending}
						/>
					</div>
				</div>
			</div>

			{isMuted && (
				<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
					<p className="text-sm font-medium text-destructive">
						{t("settings.notifications.mutedWarning")}
					</p>
				</div>
			)}

			{/* Email Digest */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Mail className="h-5 w-5 text-slate-500" />
						<div>
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
								{t("settings.notifications.emailDigest")}
							</p>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t(
									"settings.notifications.emailDigestDescription",
								)}
							</p>
						</div>
					</div>
					<Switch
						checked={prefs.emailDigest ?? false}
						onCheckedChange={(checked: boolean) => {
							updateMutation.mutate({
								organizationId,
								emailDigest: checked,
							});
						}}
						disabled={isPending || isMuted}
					/>
				</div>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute top-2.5 start-3 h-4 w-4 text-slate-400" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("settings.notifications.searchPlaceholder")}
					className="ps-9 rounded-xl"
				/>
			</div>

			{/* Groups */}
			<div
				className={`rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 ${isMuted ? "pointer-events-none opacity-50" : ""}`}
			>
				{filteredGroups.length === 0 ? (
					<p className="py-8 text-center text-sm text-slate-500">
						{t("settings.notifications.searchEmpty")}
					</p>
				) : (
					<Accordion
						type="multiple"
						value={accordionValue}
						onValueChange={setOpenModules}
					>
						{filteredGroups.map((group) => {
							const ModuleIcon = getModuleIcon(group.key);
							const enabledCount = group.events.filter(
								(event) => (events[event.key] ?? []).length > 0,
							).length;
							const allEnabled =
								group.events.length > 0 &&
								enabledCount === group.events.length;

							return (
								<AccordionItem
									key={group.key}
									value={group.key}
								>
									<AccordionTrigger className="hover:no-underline">
										<div className="flex flex-1 items-center gap-3 pe-3">
											<ModuleIcon className="h-4 w-4 shrink-0 text-slate-500" />
											<span className="font-semibold">
												{t(
													`notifications.modules.${group.key}`,
												)}
											</span>
											<Badge className="border-0 bg-slate-100 font-normal text-slate-600 dark:bg-slate-800 dark:text-slate-400">
												{t(
													"settings.notifications.enabledCount",
													{
														enabled: enabledCount,
														total: group.events
															.length,
													},
												)}
											</Badge>
											<span className="ms-auto flex items-center">
												<Switch
													checked={allEnabled}
													onCheckedChange={(
														checked: boolean,
													) => {
														toggleGroup(
															group.events,
															checked,
														);
													}}
													onClick={(
														e: React.MouseEvent,
													) => {
														e.stopPropagation();
													}}
													disabled={
														isPending || isMuted
													}
													aria-label={t(
														"settings.notifications.groupToggleAria",
														{
															module: t(
																`notifications.modules.${group.key}`,
															),
														},
													)}
												/>
											</span>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										{/* Column headers */}
										<div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2 border-b border-slate-200/70 pb-2 dark:border-slate-700/50">
											<span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
												{t(
													"settings.notifications.notificationType",
												)}
											</span>
											<span className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
												<Smartphone className="h-3.5 w-3.5" />
												{t(
													"settings.notifications.inApp",
												)}
											</span>
											<span className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
												<Mail className="h-3.5 w-3.5" />
												{t(
													"settings.notifications.email",
												)}
											</span>
										</div>
										{group.events.map((event) => (
											<NotificationEventRow
												key={event.key}
												event={event}
												channels={
													events[event.key] ?? []
												}
												disabled={isPending || isMuted}
												onToggleChannel={(channel) => {
													toggleEventChannel(
														event.key,
														channel,
													);
												}}
											/>
										))}
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				)}
			</div>
		</div>
	);
}
