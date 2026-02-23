"use client";

import { cn } from "@ui/lib";
import { Badge } from "@ui/components/badge";
import { User, Shield } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChatAttachmentPreview } from "./ChatAttachmentPreview";

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

interface ChatBubbleProps {
	message: ChatMessage;
	isMine: boolean;
	organizationId: string;
}

function formatMessageTime(date: string | Date): string {
	const d = new Date(date);
	const now = new Date();
	const isToday = d.toDateString() === now.toDateString();

	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const isYesterday = d.toDateString() === yesterday.toDateString();

	const time = d.toLocaleString("ar-SA", {
		hour: "2-digit",
		minute: "2-digit",
	});

	if (isToday) return time;
	if (isYesterday) return `أمس ${time}`;

	return d.toLocaleString("ar-SA", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function ChatBubble({ message, isMine, organizationId }: ChatBubbleProps) {
	const t = useTranslations();

	return (
		<div
			className={cn(
				"flex gap-2 max-w-[85%]",
				isMine ? "ms-auto flex-row-reverse" : "me-auto",
			)}
		>
			{/* Avatar (only for others) */}
			{!isMine && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
					{message.sender.image ? (
						<Image
							src={message.sender.image}
							alt={message.sender.name}
							width={32}
							height={32}
							className="rounded-full object-cover"
							unoptimized
						/>
					) : (
						<User className="h-4 w-4 text-muted-foreground" />
					)}
				</div>
			)}

			<div
				className={cn(
					"flex flex-col",
					isMine ? "items-end" : "items-start",
				)}
			>
				{/* Sender name */}
				{!isMine && (
					<span className="mb-0.5 px-2 text-xs text-muted-foreground">
						{message.sender.name}
					</span>
				)}

				{/* Bubble */}
				<div
					className={cn(
						"rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
						isMine
							? "rounded-ee-sm bg-primary text-primary-foreground"
							: "rounded-es-sm bg-muted text-foreground",
						message.isUpdate && "border-2 border-amber-400/50",
					)}
				>
					{message.isUpdate && (
						<Badge className="mb-1.5 border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
							<Shield className="h-3 w-3 me-1" />
							{t("projects.chat.officialUpdate")}
						</Badge>
					)}
					{message.content && (
						<p className="whitespace-pre-wrap">{message.content}</p>
					)}
				</div>

				{/* Attachments */}
				{message.attachments?.length > 0 && (
					<div className="mt-1 space-y-1">
						{message.attachments.map((att) => (
							<ChatAttachmentPreview
								key={att.id}
								attachment={att}
								organizationId={organizationId}
								isMine={isMine}
							/>
						))}
					</div>
				)}

				{/* Timestamp */}
				<span className="mt-0.5 px-2 text-[10px] text-muted-foreground">
					{formatMessageTime(message.createdAt)}
				</span>
			</div>
		</div>
	);
}
