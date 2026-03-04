"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
} from "@ui/components/dialog";
import {
	Download,
	X,
	ExternalLink,
	File,
	Image,
	Calendar,
	Folder,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DocumentViewerProps {
	organizationId: string;
	projectId: string;
	document: {
		id: string;
		title: string;
		folder: string;
		fileName?: string | null;
		fileSize?: number | null;
		mimeType?: string | null;
		storagePath?: string | null;
		uploadType?: string;
		fileUrl?: string | null;
		createdAt: string | Date;
	};
	open: boolean;
	onClose: () => void;
}

function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FOLDER_COLORS: Record<string, string> = {
	CONTRACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	DRAWINGS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	CLAIMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	LETTERS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	PHOTOS: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
	OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export function DocumentViewer({
	organizationId,
	projectId,
	document: doc,
	open,
	onClose,
}: DocumentViewerProps) {
	const t = useTranslations("projects.documents");
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [isLoadingUrl, setIsLoadingUrl] = useState(false);

	const downloadUrlMutation = useMutation(
		orpc.projectDocuments.getDownloadUrl.mutationOptions({}),
	);

	useEffect(() => {
		if (!open) {
			setFileUrl(null);
			return;
		}

		// If it's an external URL
		if (doc.uploadType === "URL" && doc.fileUrl) {
			setFileUrl(doc.fileUrl);
			return;
		}

		// If it has a storage path, get signed URL
		if (doc.storagePath) {
			setIsLoadingUrl(true);
			downloadUrlMutation
				.mutateAsync({
					organizationId,
					projectId,
					documentId: doc.id,
				})
				.then((result) => {
					setFileUrl(result.downloadUrl);
				})
				.catch(() => {
					toast.error(t("downloadError"));
				})
				.finally(() => {
					setIsLoadingUrl(false);
				});
		}
	}, [open, doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleDownload = async () => {
		if (fileUrl) {
			const link = window.document.createElement("a");
			link.href = fileUrl;
			link.download = doc.fileName || doc.title;
			link.target = "_blank";
			link.click();
		}
	};

	const isImage = doc.mimeType?.startsWith("image/");
	const isPdf = doc.mimeType === "application/pdf";
	const isExternalUrl = doc.uploadType === "URL";

	return (
		<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
					<div className="flex items-center gap-3 min-w-0">
						<div className="shrink-0 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
							{isImage ? (
								<Image className="h-5 w-5 text-pink-500" />
							) : (
								<File className="h-5 w-5 text-blue-500" />
							)}
						</div>
						<div className="min-w-0">
							<h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
								{doc.title}
							</h2>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								{doc.fileName && (
									<span className="truncate">{doc.fileName}</span>
								)}
								{doc.fileSize && (
									<>
										<span className="text-slate-300">•</span>
										<span>{formatFileSize(doc.fileSize)}</span>
									</>
								)}
								<span className="text-slate-300">•</span>
								<Badge className={`border-0 text-[10px] px-1.5 py-0 ${FOLDER_COLORS[doc.folder]}`}>
									{t(`folders.${doc.folder}`)}
								</Badge>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							className="rounded-lg"
							onClick={handleDownload}
							disabled={!fileUrl}
						>
							<Download className="h-4 w-4 me-1" />
							{t("download")}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-lg"
							onClick={onClose}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
					{isLoadingUrl ? (
						<div className="flex h-full items-center justify-center">
							<div className="relative">
								<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
								<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							</div>
						</div>
					) : !fileUrl ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
							<File className="h-16 w-16 text-slate-300" />
							<p>{t("noPreview")}</p>
						</div>
					) : isImage ? (
						<div className="flex h-full items-center justify-center p-4">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={fileUrl}
								alt={doc.title}
								className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
							/>
						</div>
					) : isPdf ? (
						<iframe
							src={fileUrl}
							className="h-full w-full"
							title={doc.title}
						/>
					) : isExternalUrl ? (
						<div className="flex h-full flex-col items-center justify-center gap-4">
							<ExternalLink className="h-16 w-16 text-slate-300" />
							<p className="text-slate-500">{t("externalLinkPreview")}</p>
							<Button
								variant="outline"
								className="rounded-xl"
								onClick={() => window.open(fileUrl, "_blank")}
							>
								<ExternalLink className="h-4 w-4 me-2" />
								{t("openInNewTab")}
							</Button>
						</div>
					) : (
						<div className="flex h-full flex-col items-center justify-center gap-4">
							<File className="h-16 w-16 text-slate-300" />
							<p className="text-slate-500">{t("noPreview")}</p>
							<Button
								variant="outline"
								className="rounded-xl"
								onClick={handleDownload}
							>
								<Download className="h-4 w-4 me-2" />
								{t("download")}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
