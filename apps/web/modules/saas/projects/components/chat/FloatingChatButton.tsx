"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@ui/lib";
import { Sheet, SheetContent } from "@ui/components/sheet";
import { useProjectRole } from "../../hooks/use-project-role";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ChatPanel } from "./ChatPanel";

interface FloatingChatButtonProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function FloatingChatButton({
	organizationId,
	organizationSlug,
	projectId,
}: FloatingChatButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const { canViewSection } = useProjectRole();

	const canChat = canViewSection("chat");

	// Poll for unread count
	const { data: unreadData } = useQuery({
		...orpc.projectChat.getUnreadCount.queryOptions({
			input: { organizationId, projectId },
		}),
		refetchInterval: 30000,
		enabled: canChat,
	});

	const unreadCount = unreadData?.count ?? 0;

	if (!canChat) return null;

	return (
		<>
			{/* Floating button - explicit left positioning for RTL */}
			{!isOpen && (
				<button
					onClick={() => setIsOpen(true)}
					className={cn(
						"fixed left-4 bottom-24 z-[9999] md:bottom-6",
						"flex items-center justify-center",
						"h-14 w-14 rounded-full",
						"bg-primary text-primary-foreground",
						"shadow-2xl shadow-primary/30",
						"hover:scale-110 active:scale-95 transition-all duration-200",
					)}
				>
					<MessageSquare className="h-6 w-6" />
					{unreadCount > 0 && (
						<span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
							{unreadCount > 99 ? "99+" : unreadCount}
						</span>
					)}
				</button>
			)}

			{/* Chat panel via Sheet */}
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent
					side="left"
					className={cn(
						"p-0 flex flex-col [&>button.absolute]:hidden",
						isFullScreen
							? "w-full sm:max-w-full"
							: "w-full sm:max-w-md lg:max-w-lg",
					)}
					dir="rtl"
				>
					<ChatPanel
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						projectId={projectId}
						isFullScreen={isFullScreen}
						onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
						onClose={() => {
							setIsOpen(false);
							setIsFullScreen(false);
						}}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
}
