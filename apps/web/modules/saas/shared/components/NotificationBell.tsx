"use client";

import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
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
import { formatRelativeTime } from "@shared/lib/formatters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NotificationBellProps {
	organizationId: string;
}

export function NotificationBell({ organizationId }: NotificationBellProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	// Query for unread count (refresh every 30 seconds)
	const { data: countData } = useQuery({
		queryKey: ["notifications", "unreadCount", organizationId],
		queryFn: () =>
			apiClient.notifications.unreadCount({
				organizationId,
			}),
		refetchInterval: 30000, // Refresh every 30 seconds
		staleTime: 10000, // Consider stale after 10 seconds
	});

	// Query for recent notifications
	const { data: notificationsData, isLoading } = useQuery({
		queryKey: ["notifications", "list", organizationId],
		queryFn: () =>
			apiClient.notifications.list({
				organizationId,
				pageSize: 5,
			}),
		staleTime: 30000,
	});

	// Mark all as read mutation
	const markAllReadMutation = useMutation({
		mutationFn: () =>
			apiClient.notifications.markRead({
				organizationId,
				markAll: true,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notifications", "unreadCount", organizationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["notifications", "list", organizationId],
			});
			toast.success("تم تحديد جميع الإشعارات كمقروءة");
		},
	});

	const unreadCount = countData?.count ?? 0;
	const notifications = notificationsData?.items ?? [];
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
					<DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
					{hasUnread && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => markAllReadMutation.mutate()}
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
						{notifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								className={cn(
									"flex cursor-pointer flex-col items-start gap-1 px-3 py-2",
									!notification.readAt && "bg-muted/50",
								)}
							>
								<div className="font-medium">{notification.title}</div>
								{notification.body && (
									<div className="text-xs text-muted-foreground line-clamp-2">
										{notification.body}
									</div>
								)}
								<div className="text-[10px] text-muted-foreground">
									{formatRelativeTime(notification.createdAt)}
								</div>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href={`/app/notifications`}
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
