"use client";

import type { NotificationModuleKey } from "@repo/database/prisma/notification-registry";
import { groupNotificationsByDay } from "@saas/notifications/lib/group-by-day";
import { getEventIcon } from "@saas/notifications/lib/notification-icons";
import { getNotificationHref } from "@saas/notifications/lib/notification-links";
import { useVisibleNotificationGroups } from "@saas/notifications/lib/use-visible-notification-groups";
import { NotificationsListSkeleton } from "@saas/shared/components/skeletons";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	AlertCircle,
	Bell,
	CheckCheck,
	CheckCircle,
	Filter,
	FilterX,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface NotificationsListProps {
	organizationId: string;
	organizationSlug: string;
}

interface NotificationItem {
	id: string;
	type: string;
	title: string;
	body?: string | null;
	projectId?: string | null;
	entityType?: string | null;
	entityId?: string | null;
	readAt?: string | Date | null;
	createdAt: string | Date;
}

const PAGE_SIZE = 20;
const ALL_MODULES = "all";

export function NotificationsList({
	organizationId,
	organizationSlug,
}: NotificationsListProps) {
	const t = useTranslations();
	const locale = useLocale();
	const queryClient = useQueryClient();
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [moduleFilter, setModuleFilter] = useState<string>(ALL_MODULES);

	const { groups: visibleGroups } = useVisibleNotificationGroups();

	const moduleInput =
		moduleFilter === ALL_MODULES
			? undefined
			: (moduleFilter as NotificationModuleKey);

	const {
		data,
		isLoading,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		orpc.notifications.list.infiniteOptions({
			input: (pageParam: number) => ({
				organizationId,
				unreadOnly,
				module: moduleInput,
				page: pageParam,
				pageSize: PAGE_SIZE,
			}),
			initialPageParam: 1,
			getNextPageParam: (lastPage) =>
				lastPage.page < lastPage.totalPages
					? lastPage.page + 1
					: undefined,
		}),
	);

	const markReadMutation = useMutation(
		orpc.notifications.markRead.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.notifications.key(),
				});
			},
			onError: (error: Error) => {
				toast.error(error.message || t("notifications.markReadError"));
			},
		}),
	);

	const handleMarkAllRead = () => {
		markReadMutation.mutate({
			organizationId,
			markAll: true,
		});
	};

	const handleMarkRead = (notificationId: string) => {
		markReadMutation.mutate({
			organizationId,
			notificationIds: [notificationId],
		});
	};

	const items = (data?.pages.flatMap((page) => page.items) ??
		[]) as NotificationItem[];
	const total = data?.pages[0]?.total ?? 0;
	const unreadCount = data?.pages[0]?.unreadCount ?? 0;
	const dayGroups = groupNotificationsByDay(items);
	const hasActiveFilter = unreadOnly || moduleFilter !== ALL_MODULES;

	const clearFilters = () => {
		setUnreadOnly(false);
		setModuleFilter(ALL_MODULES);
	};

	const formatDayHeading = (dayKey: string) => {
		if (dayKey === "today") {
			return t("notifications.days.today");
		}
		if (dayKey === "yesterday") {
			return t("notifications.days.yesterday");
		}
		return new Date(dayKey).toLocaleDateString(
			locale === "ar" ? "ar-SA" : "en-US",
			{ weekday: "long", day: "numeric", month: "long", year: "numeric" },
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-foreground">
						{t("notifications.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("notifications.description")}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Select
						value={moduleFilter}
						onValueChange={setModuleFilter}
					>
						<SelectTrigger className="w-44 rounded-xl">
							<SelectValue
								placeholder={t("notifications.filterAll")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_MODULES}>
								{t("notifications.filterAll")}
							</SelectItem>
							{visibleGroups.map((group) => (
								<SelectItem key={group.key} value={group.key}>
									{t(`notifications.modules.${group.key}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setUnreadOnly(!unreadOnly)}
						className={`rounded-xl ${unreadOnly ? "bg-primary/10" : ""}`}
					>
						<Filter className="me-2 h-4 w-4" />
						{unreadOnly
							? t("notifications.showAll")
							: t("notifications.showUnread")}
					</Button>
					{unreadCount > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleMarkAllRead}
							disabled={markReadMutation.isPending}
							className="rounded-xl"
						>
							<CheckCheck className="me-2 h-4 w-4" />
							{t("notifications.markAllRead")}
						</Button>
					)}
				</div>
			</div>

			{/* Stats */}
			{data && (
				<div className="flex gap-4">
					<Badge className="border-0 bg-muted text-muted-foreground">
						{t("notifications.total")}: {total}
					</Badge>
					{unreadCount > 0 && (
						<Badge className="border-0 bg-primary/10 text-primary">
							{t("notifications.unread")}: {unreadCount}
						</Badge>
					)}
				</div>
			)}

			{/* States */}
			{isLoading ? (
				<NotificationsListSkeleton withHeader={false} />
			) : isError ? (
				<EmptyState
					icon={<AlertCircle className="h-10 w-10" />}
					title={t("notifications.loadError")}
					description={t("notifications.loadErrorDescription")}
					action={{
						label: t("notifications.retry"),
						onClick: () => refetch(),
					}}
				/>
			) : items.length === 0 ? (
				hasActiveFilter ? (
					<EmptyState
						icon={<FilterX className="h-10 w-10" />}
						title={t("notifications.filterEmpty")}
						description={t("notifications.filterEmptyDescription")}
						action={{
							label: t("notifications.clearFilter"),
							onClick: clearFilters,
						}}
					/>
				) : (
					<EmptyState
						icon={<Bell className="h-10 w-10" />}
						title={t("notifications.noNotifications")}
						description={t(
							"notifications.noNotificationsDescription",
						)}
					/>
				)
			) : (
				<div className="space-y-6">
					{dayGroups.map((dayGroup) => (
						<div key={dayGroup.dayKey} className="space-y-3">
							<h2 className="text-sm font-semibold text-muted-foreground">
								{formatDayHeading(dayGroup.dayKey)}
							</h2>
							{dayGroup.items.map((notification) => {
								const link = getNotificationHref(
									notification,
									organizationSlug,
								);
								const isUnread = !notification.readAt;
								const EventIcon = getEventIcon(
									notification.type,
								);

								const content = (
									// biome-ignore lint/correctness/useJsxKeyInIterable: key is set on the Link/div wrapper below
									<div
										className={`group flex gap-4 rounded-2xl border-2 p-4 transition-colors ${
											isUnread
												? "border-primary/30 bg-primary/5"
												: "border-border bg-card hover:bg-accent"
										}`}
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
											<EventIcon className="h-5 w-5 text-muted-foreground" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-2">
												<h3
													className={`font-medium ${isUnread ? "text-card-foreground" : "text-muted-foreground"}`}
												>
													{notification.title}
												</h3>
												<span className="shrink-0 text-xs text-muted-foreground">
													{new Date(
														notification.createdAt,
													).toLocaleTimeString(
														locale === "ar"
															? "ar-SA"
															: "en-US",
														{
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</span>
											</div>
											{notification.body && (
												<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
													{notification.body}
												</p>
											)}
											{isUnread && (
												<Button
													variant="ghost"
													size="sm"
													onClick={(
														e: React.MouseEvent,
													) => {
														e.preventDefault();
														handleMarkRead(
															notification.id,
														);
													}}
													className="mt-2 h-auto p-0 text-xs text-primary hover:text-primary/80"
												>
													<CheckCircle className="me-1 h-3 w-3" />
													{t(
														"notifications.markAsRead",
													)}
												</Button>
											)}
										</div>
									</div>
								);

								return link ? (
									<Link
										key={notification.id}
										href={link}
										onClick={() => {
											if (isUnread) {
												handleMarkRead(notification.id);
											}
										}}
										className="block"
									>
										{content}
									</Link>
								) : (
									<div key={notification.id}>{content}</div>
								);
							})}
						</div>
					))}

					{hasNextPage && (
						<div className="flex justify-center">
							<Button
								variant="outline"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								className="rounded-xl"
							>
								{isFetchingNextPage ? (
									<Loader2 className="me-2 h-4 w-4 animate-spin" />
								) : null}
								{t("notifications.loadMore")}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
