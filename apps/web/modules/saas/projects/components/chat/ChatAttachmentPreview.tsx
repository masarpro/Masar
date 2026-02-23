"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { FileIcon, Download, ImageIcon } from "lucide-react";
import { cn } from "@ui/lib";

interface Attachment {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	storagePath: string;
}

interface ChatAttachmentPreviewProps {
	attachment: Attachment;
	organizationId: string;
	isMine: boolean;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatAttachmentPreview({
	attachment,
	organizationId,
	isMine,
}: ChatAttachmentPreviewProps) {
	const isImage = attachment.mimeType.startsWith("image/");

	const { data: urlData } = useQuery(
		orpc.attachments.getDownloadUrl.queryOptions({
			input: {
				organizationId,
				attachmentId: attachment.id,
			},
		}),
	);

	const handleDownload = () => {
		if (urlData?.downloadUrl) {
			window.open(urlData.downloadUrl, "_blank");
		}
	};

	if (isImage && urlData?.downloadUrl) {
		return (
			<div
				className={cn(
					"max-w-[240px] cursor-pointer overflow-hidden rounded-xl",
					isMine ? "ms-auto" : "me-auto",
				)}
				onClick={handleDownload}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={urlData.downloadUrl}
					alt={attachment.fileName}
					className="h-auto max-h-48 w-full object-cover"
					loading="lazy"
				/>
			</div>
		);
	}

	if (isImage && !urlData?.downloadUrl) {
		return (
			<div
				className={cn(
					"flex h-32 w-[200px] items-center justify-center rounded-xl bg-muted/50",
					isMine ? "ms-auto" : "me-auto",
				)}
			>
				<ImageIcon className="h-6 w-6 animate-pulse text-muted-foreground" />
			</div>
		);
	}

	return (
		<button
			onClick={handleDownload}
			disabled={!urlData?.downloadUrl}
			className={cn(
				"flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors",
				isMine
					? "bg-primary/80 text-primary-foreground hover:bg-primary/70"
					: "bg-muted hover:bg-muted/80",
			)}
		>
			<FileIcon className="h-4 w-4 shrink-0" />
			<div className="flex flex-col items-start gap-0.5">
				<span className="max-w-[160px] truncate">{attachment.fileName}</span>
				<span className="opacity-70">{formatFileSize(attachment.fileSize)}</span>
			</div>
			<Download className="h-3 w-3 shrink-0" />
		</button>
	);
}
