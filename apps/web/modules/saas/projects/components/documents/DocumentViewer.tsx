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
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
	ssr: false,
});

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
		createdAt: string | Date;
	};
	open: boolean;
	onClose: () => void;
}

const OFFICE_MIME_TYPES = [
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

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

		if (doc.storagePath) {
			setIsLoadingUrl(true);
			downloadUrlMutation
				.mutateAsync({ organizationId, projectId, documentId: doc.id })
				.then((result) => setFileUrl(result.downloadUrl))
				.catch(() => toast.error(t("downloadError")))
				.finally(() => setIsLoadingUrl(false));
		}
	}, [open, doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleDownload = useCallback(() => {
		if (!fileUrl) return;
		const link = window.document.createElement("a");
		link.href = fileUrl;
		link.download = doc.fileName || doc.title;
		link.click();
	}, [fileUrl, doc.fileName, doc.title]);

	const isImage = doc.mimeType?.startsWith("image/");
	const isPdf = doc.mimeType === "application/pdf";
	const isOffice = doc.mimeType ? OFFICE_MIME_TYPES.includes(doc.mimeType) : false;
	const isViewableInGoogleViewer = isPdf || isOffice;

	// --- Image → Lightbox ---
	if (isImage) {
		return (
			<Lightbox
				open={open}
				close={onClose}
				slides={fileUrl ? [{ src: fileUrl, alt: doc.title }] : []}
				plugins={[Zoom]}
				carousel={{ finite: true }}
				render={{
					buttonPrev: () => null,
					buttonNext: () => null,
				}}
				toolbar={{
					buttons: [
						<button
							key="download"
							type="button"
							className="yarl__button"
							onClick={handleDownload}
							title={t("download")}
						>
							<Download className="h-5 w-5" />
						</button>,
						"close",
					],
				}}
				styles={{
					container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
				}}
			/>
		);
	}

	// --- PDF / Office → Google Drive Viewer Dialog ---
	if (isViewableInGoogleViewer) {
		const googleViewerUrl = fileUrl
			? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
			: null;

		return (
			<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
				<DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
						<h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
							{doc.title}
						</h2>
						<div className="flex items-center gap-2">
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
								className="h-8 w-8 shrink-0 rounded-lg"
								onClick={onClose}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
						{isLoadingUrl || !googleViewerUrl ? (
							<div className="flex h-full items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<iframe
								src={googleViewerUrl}
								className="h-full w-full border-0"
								title={doc.title}
								allowFullScreen
							/>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center gap-2 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
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
				</DialogContent>
			</Dialog>
		);
	}

	// --- Other file types → Download-only Dialog ---
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<div className="flex flex-col items-center gap-4 py-6 text-center">
					<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
						{doc.title}
					</p>
					<p className="text-sm text-slate-500">{t("noPreview")}</p>
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={handleDownload}
						disabled={!fileUrl || isLoadingUrl}
					>
						{isLoadingUrl ? (
							<Loader2 className="h-4 w-4 me-2 animate-spin" />
						) : (
							<Download className="h-4 w-4 me-2" />
						)}
						{t("download")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
