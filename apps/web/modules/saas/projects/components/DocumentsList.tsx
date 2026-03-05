"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	FolderOpen,
	Plus,
	Search,
	File,
	FileText,
	Image,
	FileSpreadsheet,
	Presentation,
	CheckCircle,
	Clock,
	XCircle,
	MoreVertical,
	Download,
	Eye,
	Trash2,
	Shield,
	Info,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DocumentViewer } from "./documents/DocumentViewer";

interface DocumentsListProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getApprovalStatusBadge(status?: string) {
	switch (status) {
		case "PENDING":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					<Clock className="h-3 w-3 me-1" />
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					<CheckCircle className="h-3 w-3 me-1" />
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					<XCircle className="h-3 w-3 me-1" />
				</Badge>
			);
		default:
			return null;
	}
}

/** Returns an icon + background color based on mime type */
function getFileTypeIcon(mimeType?: string | null) {
	if (mimeType?.startsWith("image/")) {
		return { icon: Image, bg: "bg-pink-100 dark:bg-pink-950/30", color: "text-pink-500" };
	}
	if (mimeType === "application/pdf") {
		return { icon: FileText, bg: "bg-red-100 dark:bg-red-950/30", color: "text-red-500" };
	}
	if (
		mimeType === "application/msword" ||
		mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return { icon: FileText, bg: "bg-blue-100 dark:bg-blue-950/30", color: "text-blue-500" };
	}
	if (
		mimeType === "application/vnd.ms-excel" ||
		mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return { icon: FileSpreadsheet, bg: "bg-green-100 dark:bg-green-950/30", color: "text-green-500" };
	}
	if (
		mimeType === "application/vnd.ms-powerpoint" ||
		mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	) {
		return { icon: Presentation, bg: "bg-orange-100 dark:bg-orange-950/30", color: "text-orange-500" };
	}
	return { icon: File, bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-400" };
}

const FOLDER_COLORS: Record<string, string> = {
	CONTRACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	DRAWINGS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	CLAIMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	LETTERS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	PHOTOS: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
	OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export function DocumentsList({
	organizationId,
	organizationSlug,
	projectId,
}: DocumentsListProps) {
	const t = useTranslations("projects.documents");
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const queryClient = useQueryClient();

	const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewerDoc, setViewerDoc] = useState<any>(null);

	const { data, isLoading } = useQuery(
		orpc.projectDocuments.list.queryOptions({
			input: {
				organizationId,
				projectId,
				folder: selectedFolder as any,
				search: searchQuery || undefined,
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.projectDocuments.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("deleteSuccess"));
				queryClient.invalidateQueries({
					queryKey: [["projectDocuments", "list"]],
				});
			},
			onError: (error) => {
				toast.error(error.message || t("deleteError"));
			},
		}),
	);

	const downloadUrlMutation = useMutation(
		orpc.projectDocuments.getDownloadUrl.mutationOptions({}),
	);

	const handleDelete = useCallback((docId: string) => {
		if (!confirm(t("deleteConfirm"))) return;
		deleteMutation.mutate({ organizationId, projectId, documentId: docId });
	}, [deleteMutation, organizationId, projectId, t]);

	const handleDownload = useCallback(async (doc: any) => {
		try {
			const result = await downloadUrlMutation.mutateAsync({
				organizationId,
				projectId,
				documentId: doc.id,
			});
			const link = window.document.createElement("a");
			link.href = result.downloadUrl;
			link.download = doc.fileName || doc.title;
			link.click();
		} catch {
			toast.error(t("downloadError"));
		}
	}, [downloadUrlMutation, organizationId, projectId, t]);

	const FOLDER_TABS = [
		{ key: undefined, labelKey: "folders.ALL" },
		{ key: "CONTRACT", labelKey: "folders.CONTRACT" },
		{ key: "DRAWINGS", labelKey: "folders.DRAWINGS" },
		{ key: "CLAIMS", labelKey: "folders.CLAIMS" },
		{ key: "LETTERS", labelKey: "folders.LETTERS" },
		{ key: "PHOTOS", labelKey: "folders.PHOTOS" },
		{ key: "OTHER", labelKey: "folders.OTHER" },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
					{t("title")}
				</h1>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/documents/new`}>
						<Plus className="h-4 w-4 me-2" />
						{t("addDocument")}
					</Link>
				</Button>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder={t("searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-white py-2 pe-4 ps-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					{FOLDER_TABS.map((folder) => (
						<button
							key={folder.key ?? "all"}
							type="button"
							onClick={() => setSelectedFolder(folder.key)}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								selectedFolder === folder.key
									? "bg-primary text-primary-foreground"
									: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							}`}
						>
							{t(folder.labelKey)}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
						>
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
								<div className="flex-1 space-y-1.5">
									<div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
									<div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : !data?.items?.length ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<FolderOpen className="h-12 w-12 text-slate-400" />
					</div>
					<p className="mb-2 text-lg font-medium text-slate-700 dark:text-slate-300">
						{t("noDocuments")}
					</p>
					<p className="mb-6 text-sm text-slate-500">
						{t("noDocumentsDescription")}
					</p>
					<Button asChild className="rounded-xl">
						<Link href={`${basePath}/documents/new`}>
							<Plus className="h-4 w-4 me-2" />
							{t("addFirstDocument")}
						</Link>
					</Button>
				</div>
			) : (
				/* ─── Compact Grid ─── */
				<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
					{data.items.map((doc) => {
						const { icon: FileIcon, bg, color } = getFileTypeIcon(doc.mimeType);
						return (
							<div
								key={doc.id}
								className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-primary/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
							>
								{/* File icon — click opens viewer */}
								<button
									type="button"
									onClick={() => setViewerDoc(doc)}
									className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ${bg} cursor-pointer`}
								>
									<FileIcon className={`h-5 w-5 ${color}`} />
								</button>

								{/* Name + meta — click opens viewer */}
								<button
									type="button"
									onClick={() => setViewerDoc(doc)}
									className="min-w-0 flex-1 text-start cursor-pointer"
								>
									<p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary dark:text-slate-100">
										{doc.title}
									</p>
									<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
										<Badge className={`border-0 text-[10px] px-1.5 py-0 ${FOLDER_COLORS[doc.folder]}`}>
											{t(`folders.${doc.folder}`)}
										</Badge>
										{doc.fileSize && (
											<>
												<span className="text-slate-300">•</span>
												<span>{formatFileSize(doc.fileSize)}</span>
											</>
										)}
									</div>
								</button>

								{/* Approval badge */}
								{doc.approvals?.[0] && (
									<div className="shrink-0">
										{getApprovalStatusBadge(doc.approvals[0].status)}
									</div>
								)}

								{/* Dropdown */}
								<div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-lg"
											>
												<MoreVertical className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => setViewerDoc(doc)}>
												<Eye className="h-4 w-4 me-2" />
												{t("view")}
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleDownload(doc)}>
												<Download className="h-4 w-4 me-2" />
												{t("download")}
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href={`${basePath}/documents/${doc.id}`}>
													<Info className="h-4 w-4 me-2" />
													{t("details")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href={`${basePath}/documents/${doc.id}`}>
													<Shield className="h-4 w-4 me-2" />
													{t("requestApproval")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-red-600 focus:text-red-600"
												onClick={() => handleDelete(doc.id)}
											>
												<Trash2 className="h-4 w-4 me-2" />
												{t("delete")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Document Viewer */}
			{viewerDoc && (
				<DocumentViewer
					organizationId={organizationId}
					projectId={projectId}
					document={viewerDoc}
					open={!!viewerDoc}
					onClose={() => setViewerDoc(null)}
				/>
			)}
		</div>
	);
}
