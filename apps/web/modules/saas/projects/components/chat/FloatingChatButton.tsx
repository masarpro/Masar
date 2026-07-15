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
		// Don't keep polling while the tab is hidden — this runs on every
		// project sub-page and was a steady source of background load.
		refetchIntervalInBackground: false,
		enabled: canChat,
	});

	const unreadCount = unreadData?.count ?? 0;

	if (!canChat) return null;

	return (
		<>
			{/* زر عائم في الطرف المقابل لزر المساعد — نفس الأبعاد والمسافات
			    تماماً (bottom-20 فوق الشريط السفلي العام على الجوال، 6 من
			    الحافة) ونفس هندسة الظل بلون أسود بدل توهج المساعد الأحمر */}
			{!isOpen && (
				<button
					onClick={() => setIsOpen(true)}
					className={cn(
						"fixed end-6 bottom-20 z-[60] md:bottom-6",
						"flex items-center justify-center",
						"h-14 w-14 rounded-full",
						"bg-primary text-primary-foreground ring-1 ring-white/15",
						"shadow-[0_10px_30px_-4px_rgba(0,0,0,0.35)]",
						"hover:scale-105 active:scale-95 transition-all duration-300",
					)}
				>
					<MessageSquare className="h-6 w-6" />
					{unreadCount > 0 && (
						<span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
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
