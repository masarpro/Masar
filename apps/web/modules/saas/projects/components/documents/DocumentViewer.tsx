"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
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

		if (doc.uploadType === "URL" && doc.fileUrl) {
			setFileUrl(doc.fileUrl);
			return;
		}

		if (doc.storagePath) {
			setIsLoadingUrl(true);
			downloadUrlMutation
				.mutateAsync({ organizationId, projectId, documentId: doc.id })
				.then((result) => setFileUrl(result.downloadUrl))
				.catch(() => toast.error(t("downloadError")))
				.finally(() => setIsLoadingUrl(false));
		}
	}, [open, doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleDownload = () => {
		if (!fileUrl) return;
		const link = window.document.createElement("a");
		link.href = fileUrl;
		link.download = doc.fileName || doc.title;
		link.target = "_blank";
		link.click();
	};

	const isImage = doc.mimeType?.startsWith("image/");
	const isPdf = doc.mimeType === "application/pdf";
	const isExternalUrl = doc.uploadType === "URL";

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
				{/* Minimal Header: title + close */}
				<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
					<h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
						{doc.title}
					</h2>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0 rounded-lg"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* File Content */}
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
							<p className="text-sm">{t("noPreview")}</p>
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
							sandbox="allow-same-origin allow-scripts allow-forms"
						/>
					) : isExternalUrl ? (
						<div className="flex h-full flex-col items-center justify-center gap-4">
							<ExternalLink className="h-16 w-16 text-slate-300" />
							<p className="text-sm text-slate-500">{t("externalLinkPreview")}</p>
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
							<p className="text-sm text-slate-500">{t("noPreview")}</p>
							<Button variant="outline" className="rounded-xl" onClick={handleDownload}>
								<Download className="h-4 w-4 me-2" />
								{t("download")}
							</Button>
						</div>
					)}
				</div>

				{/* Minimal Footer: download + file info */}
				<div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
					<div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
						{doc.fileName && (
							<span className="truncate max-w-[200px]">{doc.fileName}</span>
						)}
						{doc.fileSize && (
							<>
								<span className="text-slate-300">•</span>
								<span className="shrink-0">{formatFileSize(doc.fileSize)}</span>
							</>
						)}
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0 rounded-lg"
						onClick={handleDownload}
						disabled={!fileUrl}
					>
						<Download className="h-4 w-4 me-1" />
						{t("download")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
