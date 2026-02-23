"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import {
	Send,
	Paperclip,
	X,
	ImageIcon,
	FileIcon,
	Shield,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@ui/lib";

type MessageChannel = "TEAM" | "OWNER";

interface UploadedAttachment {
	id: string;
	fileName: string;
	mimeType: string;
	fileSize: number;
}

interface ChatInputProps {
	organizationId: string;
	projectId: string;
	channel: MessageChannel;
}

export function ChatInput({
	organizationId,
	projectId,
	channel,
}: ChatInputProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [message, setMessage] = useState("");
	const [isUpdate, setIsUpdate] = useState(false);
	const [pendingAttachments, setPendingAttachments] = useState<
		UploadedAttachment[]
	>([]);
	const [uploading, setUploading] = useState(false);

	const getUploadUrlMutation = useMutation({
		...orpc.attachments.createUploadUrl.mutationOptions(),
	});

	const finalizeUploadMutation = useMutation({
		...orpc.attachments.finalizeUpload.mutationOptions(),
	});

	const sendMessageMutation = useMutation(
		orpc.projectChat.sendMessage.mutationOptions({
			onSuccess: () => {
				setMessage("");
				setIsUpdate(false);
				setPendingAttachments([]);
				queryClient.invalidateQueries({
					queryKey: [["projectChat", "listMessages"]],
				});
				queryClient.invalidateQueries({
					queryKey: [["projectChat", "getUnreadCount"]],
				});
			},
			onError: (error) => {
				toast.error(error.message || t("projects.chat.sendError"));
			},
		}),
	);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (!files.length) return;

		setUploading(true);
		try {
			for (const file of files) {
				// Step 1: Get upload URL
				const { uploadUrl, uploadId, storagePath } =
					await getUploadUrlMutation.mutateAsync({
						organizationId,
						projectId,
						ownerType: "MESSAGE",
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type,
					});

				// Step 2: Upload to S3
				const uploadResponse = await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});

				if (!uploadResponse.ok) {
					throw new Error("فشل رفع الملف");
				}

				// Step 3: Finalize upload
				const attachment = await finalizeUploadMutation.mutateAsync({
					organizationId,
					projectId,
					uploadId,
					ownerType: "MESSAGE",
					ownerId: "pending-message",
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type,
					storagePath,
				});

				setPendingAttachments((prev) => [
					...prev,
					{
						id: attachment.id,
						fileName: file.name,
						mimeType: file.type,
						fileSize: file.size,
					},
				]);
			}
		} catch {
			toast.error(t("projects.chat.uploadError"));
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleSend = () => {
		if (!message.trim() && !pendingAttachments.length) return;

		sendMessageMutation.mutate({
			organizationId,
			projectId,
			channel,
			content: message.trim() || "\u{1F4CE}",
			isUpdate: channel === "OWNER" ? isUpdate : false,
			attachmentIds: pendingAttachments.map((a) => a.id),
		});
	};

	const removePendingAttachment = (id: string) => {
		setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
	};

	return (
		<div className="space-y-2 border-t px-4 py-3">
			{/* Pending attachments preview */}
			{pendingAttachments.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{pendingAttachments.map((att) => (
						<div
							key={att.id}
							className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs"
						>
							{att.mimeType.startsWith("image/") ? (
								<ImageIcon className="h-3 w-3" />
							) : (
								<FileIcon className="h-3 w-3" />
							)}
							<span className="max-w-[100px] truncate">{att.fileName}</span>
							<button
								onClick={() => removePendingAttachment(att.id)}
								className="rounded-full p-0.5 hover:bg-background"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Official update toggle (OWNER channel only) */}
			{channel === "OWNER" && (
				<label className="flex items-center gap-2 text-xs">
					<input
						type="checkbox"
						checked={isUpdate}
						onChange={(e) => setIsUpdate(e.target.checked)}
						className="h-3.5 w-3.5 rounded"
					/>
					<Shield className="h-3.5 w-3.5 text-amber-500" />
					<span className="text-muted-foreground">
						{t("projects.chat.markAsOfficialUpdate")}
					</span>
				</label>
			)}

			{/* Input row */}
			<div className="flex items-end gap-2">
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/jpeg,image/png,image/webp,application/pdf"
					onChange={handleFileSelect}
					className="hidden"
				/>

				{/* Attachment button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 rounded-xl"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
				>
					{uploading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Paperclip className="h-4 w-4" />
					)}
				</Button>

				{/* Message textarea */}
				<Textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={t("projects.chat.messagePlaceholder")}
					className="min-h-10 max-h-24 flex-1 resize-none rounded-xl text-sm"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>

				{/* Send button */}
				<Button
					size="icon"
					className="h-9 w-9 shrink-0 rounded-xl"
					onClick={handleSend}
					disabled={
						sendMessageMutation.isPending ||
						uploading ||
						(!message.trim() && !pendingAttachments.length)
					}
				>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
