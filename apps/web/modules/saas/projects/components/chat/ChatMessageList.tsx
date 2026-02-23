"use client";

import { useRef, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChatBubble } from "./ChatBubble";

interface ChatAttachment {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	storagePath: string;
}

interface ChatMessage {
	id: string;
	content: string;
	senderId: string;
	sender: { id: string; name: string; image: string | null };
	isUpdate: boolean;
	createdAt: string | Date;
	attachments: ChatAttachment[];
}

interface ChatMessageListProps {
	messages: ChatMessage[];
	isLoading: boolean;
	currentUserId?: string;
	organizationId: string;
}

export function ChatMessageList({
	messages,
	isLoading,
	currentUserId,
	organizationId,
}: ChatMessageListProps) {
	const t = useTranslations();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="relative">
					<div className="h-10 w-10 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	if (!messages.length) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center text-center">
				<div className="mb-3 rounded-2xl bg-muted p-4">
					<MessageSquare className="h-10 w-10 text-muted-foreground" />
				</div>
				<p className="text-sm text-muted-foreground">
					{t("projects.chat.noMessages")}
				</p>
				<p className="mt-1 text-xs text-muted-foreground/60">
					{t("projects.chat.startConversation")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
			{messages.map((message) => (
				<ChatBubble
					key={message.id}
					message={message}
					isMine={message.senderId === currentUserId}
					organizationId={organizationId}
				/>
			))}
			<div ref={messagesEndRef} />
		</div>
	);
}
