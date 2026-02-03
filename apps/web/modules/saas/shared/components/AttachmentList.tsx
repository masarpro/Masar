"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Download,
	FileIcon,
	FileText,
	Image,
	Trash2,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type AttachmentOwnerType =
	| "DOCUMENT"
	| "PHOTO"
	| "EXPENSE"
	| "ISSUE"
	| "MESSAGE"
	| "CLAIM";

interface AttachmentListProps {
	organizationId: string;
	ownerType: AttachmentOwnerType;
	ownerId: string;
	canDelete?: boolean;
	className?: string;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) {
		return Image;
	}
	if (mimeType === "application/pdf") {
		return FileText;
	}
	return FileIcon;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
	organizationId,
	ownerType,
	ownerId,
	canDelete = true,
	className,
}: AttachmentListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		orpc.attachments.list.queryOptions({
			input: { organizationId, ownerType, ownerId },
		}),
	);

	const downloadMutation = useMutation({
		...orpc.attachments.getDownloadUrl.mutationOptions(),
		onSuccess: (result) => {
			// Open download URL in new tab
			window.open(result.downloadUrl, "_blank");
		},
		onError: () => {
			toast.error("فشل تحميل الملف");
		},
	});

	const deleteMutation = useMutation({
		...orpc.attachments.delete.mutationOptions(),
		onSuccess: () => {
			toast.success("تم حذف المرفق");
			queryClient.invalidateQueries({
				queryKey: orpc.attachments.list.queryOptions({
					input: { organizationId, ownerType, ownerId },
				}).queryKey,
			});
		},
		onError: () => {
			toast.error("فشل حذف المرفق");
		},
	});

	const handleDownload = (attachmentId: string) => {
		downloadMutation.mutate({ organizationId, attachmentId });
	};

	const handleDelete = (attachmentId: string) => {
		if (confirm("هل أنت متأكد من حذف هذا المرفق؟")) {
			deleteMutation.mutate({ organizationId, attachmentId });
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-4">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
			</div>
		);
	}

	const attachments = data?.attachments || [];

	if (attachments.length === 0) {
		return null;
	}

	return (
		<div className={className}>
			<div className="space-y-2">
				{attachments.map((attachment) => {
					const Icon = getFileIcon(attachment.mimeType);
					return (
						<div
							key={attachment.id}
							className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
								<Icon className="h-5 w-5 text-slate-500" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
									{attachment.fileName}
								</p>
								<p className="text-xs text-slate-500">
									{formatFileSize(attachment.fileSize)}
								</p>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleDownload(attachment.id)}
									disabled={downloadMutation.isPending}
									className="rounded-lg"
								>
									{downloadMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Download className="h-4 w-4" />
									)}
								</Button>
								{canDelete && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDelete(attachment.id)}
										disabled={deleteMutation.isPending}
										className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
									>
										{deleteMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
