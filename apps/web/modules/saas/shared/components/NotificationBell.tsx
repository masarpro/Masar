"use client";

import { getEventIcon } from "@saas/notifications/lib/notification-icons";
import { getNotificationHref } from "@saas/notifications/lib/notification-links";
import { formatRelativeTime } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import { BellIcon, CheckCheckIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface NotificationBellProps {
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

export function NotificationBell({
	organizationId,
	organizationSlug,
}: NotificationBellProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const notificationsPageHref = `/app/${organizationSlug}/notifications`;

	// Query for unread count (refresh every 30 seconds via polling)
	const { data: countData } = useQuery(
		orpc.notifications.unreadCount.queryOptions({
			input: { organizationId },
			refetchInterval: 30000,
			staleTime: STALE_TIMES.NOTIFICATIONS,
		}),
	);

	// Query for recent notifications
	const { data: notificationsData, isLoading } = useQuery(
		orpc.notifications.list.queryOptions({
			input: { organizationId, pageSize: 5 },
			staleTime: STALE_TIMES.NOTIFICATIONS,
		}),
	);

	const invalidateNotifications = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.notifications.key(),
		});
	};

	// Mark all as read mutation
	const markAllReadMutation = useMutation(
		orpc.notifications.markRead.mutationOptions({
			onSuccess: () => {
				invalidateNotifications();
				toast.success(t("notifications.markAllReadSuccess"));
			},
		}),
	);

	// Fire-and-forget single mark-read on item click
	const markReadMutation = useMutation(
		orpc.notifications.markRead.mutationOptions({
			onSuccess: () => {
				invalidateNotifications();
			},
		}),
	);

	const handleItemClick = (notification: NotificationItem) => {
		if (!notification.readAt) {
			markReadMutation.mutate({
				organizationId,
				notificationIds: [notification.id],
			});
		}
	};

	const unreadCount = countData?.count ?? 0;
	const notifications = (notificationsData?.items ??
		[]) as NotificationItem[];
	const hasUnread = unreadCount > 0;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					aria-label={t("notifications.title")}
				>
					<BellIcon className="size-5" />
					{hasUnread && (
						<span className="absolute -top-1 -end-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<div className="flex items-center justify-between px-2">
					<DropdownMenuLabel>
						{t("notifications.title")}
					</DropdownMenuLabel>
					{hasUnread && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => {
								markAllReadMutation.mutate({
									organizationId,
									markAll: true,
								});
							}}
							disabled={markAllReadMutation.isPending}
						>
							<CheckCheckIcon className="me-1 size-3" />
							{t("notifications.markAllRead")}
						</Button>
					)}
				</div>
				<DropdownMenuSeparator />

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : notifications.length === 0 ? (
					<div className="py-8 text-center text-sm text-muted-foreground">
						{t("notifications.empty")}
					</div>
				) : (
					<>
						{notifications.map((notification) => {
							const EventIcon = getEventIcon(notification.type);
							const href =
								getNotificationHref(
									notification,
									organizationSlug,
								) ?? notificationsPageHref;

							return (
								<DropdownMenuItem
									key={notification.id}
									asChild
									className={cn(
										"cursor-pointer px-3 py-2",
										!notification.readAt && "bg-muted/50",
									)}
								>
									<Link
										href={href}
										onClick={() =>
											handleItemClick(notification)
										}
										className="flex items-start gap-2.5"
									>
										<EventIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										<span className="flex min-w-0 flex-1 flex-col items-start gap-1">
											<span className="font-medium">
												{notification.title}
											</span>
											{notification.body && (
												<span className="line-clamp-2 text-xs text-muted-foreground">
													{notification.body}
												</span>
											)}
											<span className="text-[10px] text-muted-foreground">
												{formatRelativeTime(
													notification.createdAt,
												)}
											</span>
										</span>
									</Link>
								</DropdownMenuItem>
							);
						})}
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href={notificationsPageHref}
								className="flex w-full justify-center text-sm font-medium text-primary"
							>
								{t("notifications.viewAll")}
							</Link>
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
