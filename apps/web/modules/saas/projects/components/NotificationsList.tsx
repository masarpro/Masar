"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Bell,
	CheckCircle,
	FileText,
	MessageSquare,
	Shield,
	CheckCheck,
	Filter,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface NotificationsListProps {
	organizationId: string;
	organizationSlug: string;
}

function getNotificationIcon(type: string) {
	switch (type) {
		case "APPROVAL_REQUESTED":
		case "APPROVAL_DECIDED":
			return <Shield className="h-5 w-5 text-amber-500" />;
		case "OWNER_MESSAGE":
			return <MessageSquare className="h-5 w-5 text-blue-500" />;
		case "DOCUMENT_CREATED":
			return <FileText className="h-5 w-5 text-purple-500" />;
		default:
			return <Bell className="h-5 w-5 text-slate-500" />;
	}
}

function getNotificationLink(
	notification: { projectId?: string | null; entityType?: string | null; entityId?: string | null },
	organizationSlug: string,
) {
	if (!notification.projectId) return null;

	const basePath = `/app/${organizationSlug}/projects/${notification.projectId}`;

	switch (notification.entityType) {
		case "approval":
		case "document":
			return `${basePath}/documents/${notification.entityId || ""}`;
		case "message":
			return `${basePath}/chat`;
		default:
			return basePath;
	}
}

export function NotificationsList({
	organizationId,
	organizationSlug,
}: NotificationsListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [unreadOnly, setUnreadOnly] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.notifications.list.queryOptions({
			input: {
				organizationId,
				unreadOnly,
			},
		}),
	);

	const markReadMutation = useMutation(
		orpc.notifications.markRead.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["notifications", "list"]],
				});
			},
			onError: (error) => {
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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("notifications.title")}
					</h1>
					<p className="text-sm text-slate-500">
						{t("notifications.description")}
					</p>
				</div>
				<div className="flex gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setUnreadOnly(!unreadOnly)}
						className={`rounded-xl ${unreadOnly ? "bg-primary/10" : ""}`}
					>
						<Filter className="h-4 w-4 me-2" />
						{unreadOnly ? t("notifications.showAll") : t("notifications.showUnread")}
					</Button>
					{data?.unreadCount && data.unreadCount > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleMarkAllRead}
							disabled={markReadMutation.isPending}
							className="rounded-xl"
						>
							<CheckCheck className="h-4 w-4 me-2" />
							{t("notifications.markAllRead")}
						</Button>
					)}
				</div>
			</div>

			{/* Stats */}
			{data && (
				<div className="flex gap-4">
					<Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
						{t("notifications.total")}: {data.total}
					</Badge>
					{data.unreadCount > 0 && (
						<Badge className="border-0 bg-primary/10 text-primary">
							{t("notifications.unread")}: {data.unreadCount}
						</Badge>
					)}
				</div>
			)}

			{/* Notifications List */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
						<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				</div>
			) : !data?.items?.length ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<Bell className="h-12 w-12 text-slate-400" />
					</div>
					<p className="mb-2 text-lg font-medium text-slate-700 dark:text-slate-300">
						{t("notifications.noNotifications")}
					</p>
					<p className="text-sm text-slate-500">
						{t("notifications.noNotificationsDescription")}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{data.items.map((notification) => {
						const link = getNotificationLink(notification, organizationSlug);
						const isUnread = !notification.readAt;

						const content = (
							<div
								className={`group flex gap-4 rounded-2xl border p-4 transition-colors ${
									isUnread
										? "border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10"
										: "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
								}`}
							>
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
									{getNotificationIcon(notification.type)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<h3 className={`font-medium ${isUnread ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
											{notification.title}
										</h3>
										<span className="shrink-0 text-xs text-slate-400">
											{new Date(notification.createdAt).toLocaleDateString("ar-SA")}
										</span>
									</div>
									{notification.body && (
										<p className="mt-1 text-sm text-slate-500 line-clamp-2">
											{notification.body}
										</p>
									)}
									{isUnread && (
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.preventDefault();
												handleMarkRead(notification.id);
											}}
											className="mt-2 h-auto p-0 text-xs text-primary hover:text-primary/80"
										>
											<CheckCircle className="h-3 w-3 me-1" />
											{t("notifications.markAsRead")}
										</Button>
									)}
								</div>
							</div>
						);

						return link ? (
							<Link key={notification.id} href={link}>
								{content}
							</Link>
						) : (
							<div key={notification.id}>{content}</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
