"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useSession } from "@saas/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import { SheetTitle } from "@ui/components/sheet";
import { Button } from "@ui/components/button";
import { Maximize2, Minimize2, X, Users, Shield } from "lucide-react";
import { cn } from "@ui/lib";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

type MessageChannel = "TEAM" | "OWNER";

interface ChatPanelProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	isFullScreen: boolean;
	onToggleFullScreen: () => void;
	onClose: () => void;
}

export function ChatPanel({
	organizationId,
	organizationSlug,
	projectId,
	isFullScreen,
	onToggleFullScreen,
	onClose,
}: ChatPanelProps) {
	const t = useTranslations();
	const { user } = useSession();
	const queryClient = useQueryClient();
	const [activeChannel, setActiveChannel] = useState<MessageChannel>("TEAM");

	// Fetch messages with polling
	const { data: messages, isLoading } = useQuery({
		...orpc.projectChat.listMessages.queryOptions({
			input: {
				organizationId,
				projectId,
				channel: activeChannel,
			},
		}),
		refetchInterval: 15000,
	});

	// Mark as read mutation
	const markAsReadMutation = useMutation(
		orpc.projectChat.markAsRead.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["projectChat", "getUnreadCount"]],
				});
			},
		}),
	);

	// Mark channel as read when switching or receiving new messages
	const markAsRead = useCallback(() => {
		markAsReadMutation.mutate({
			organizationId,
			projectId,
			channel: activeChannel,
		});
	}, [organizationId, projectId, activeChannel]);

	useEffect(() => {
		markAsRead();
	}, [activeChannel, messages?.items?.length]);

	const channels = [
		{
			key: "TEAM" as MessageChannel,
			label: t("projects.chat.teamChannel"),
			icon: Users,
			note: t("projects.chat.teamChannelNote"),
			noteColor: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
		},
		{
			key: "OWNER" as MessageChannel,
			label: t("projects.chat.ownerChannel"),
			icon: Shield,
			note: t("projects.chat.ownerChannelNote"),
			noteColor: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
		},
	];

	const activeChannelConfig = channels.find((c) => c.key === activeChannel);

	return (
		<div className="flex h-full flex-col" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<SheetTitle className="text-base font-semibold">
					{t("projects.chat.title")}
				</SheetTitle>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onToggleFullScreen}
					>
						{isFullScreen ? (
							<Minimize2 className="h-4 w-4" />
						) : (
							<Maximize2 className="h-4 w-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Channel Tabs */}
			<div className="border-b px-4 py-2">
				<div className="flex gap-1.5 rounded-xl bg-muted/50 p-1">
					{channels.map((channel) => (
						<button
							key={channel.key}
							onClick={() => setActiveChannel(channel.key)}
							className={cn(
								"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
								activeChannel === channel.key
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<channel.icon className="h-3.5 w-3.5" />
							{channel.label}
						</button>
					))}
				</div>

				{/* Channel note */}
				{activeChannelConfig && (
					<div
						className={cn(
							"mt-2 rounded-lg px-3 py-1.5 text-xs",
							activeChannelConfig.noteColor,
						)}
					>
						<activeChannelConfig.icon className="me-1 inline h-3 w-3" />
						{activeChannelConfig.note}
					</div>
				)}
			</div>

			{/* Messages */}
			<ChatMessageList
				messages={(messages?.items as any[]) ?? []}
				isLoading={isLoading}
				currentUserId={user?.id}
				organizationId={organizationId}
			/>

			{/* Input */}
			<ChatInput
				organizationId={organizationId}
				projectId={projectId}
				channel={activeChannel}
			/>
		</div>
	);
}
