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
import { cn } from "@ui/lib";
import {
	ChevronLeft,
	Clock,
	CheckCircle,
	Download,
	Eye,
	Folder,
	FolderOpen,
	FolderPlus,
	Info,
	MoreVertical,
	Pencil,
	Search,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentViewer } from "./DocumentViewer";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { FolderFormDialog } from "./FolderFormDialog";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { formatFileSize, getFileTypeStyle } from "./file-icons";

interface DocumentsExplorerProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

// خرائط ألوان مجلدات (مفتاح اللون → أصناف Tailwind)
const FOLDER_COLOR_MAP: Record<string, { bg: string; icon: string }> = {
	slate: { bg: "bg-muted", icon: "text-muted-foreground" },
	blue: { bg: "bg-chart-4/15", icon: "text-chart-4" },
	purple: { bg: "bg-chart-4/15", icon: "text-chart-4" },
	green: { bg: "bg-success/15", icon: "text-success" },
	amber: { bg: "bg-chart-1/15", icon: "text-chart-1" },
	pink: { bg: "bg-chart-2/15", icon: "text-chart-2" },
	cyan: { bg: "bg-chart-3/15", icon: "text-chart-3" },
	red: { bg: "bg-destructive/15", icon: "text-destructive" },
};

function folderColor(color?: string | null) {
	return FOLDER_COLOR_MAP[color ?? "slate"] ?? FOLDER_COLOR_MAP.slate;
}

function approvalBadge(status?: string) {
	switch (status) {
		case "PENDING":
			return <Clock className="h-3.5 w-3.5 text-chart-1" />;
		case "APPROVED":
			return <CheckCircle className="h-3.5 w-3.5 text-success" />;
		case "REJECTED":
			return <XCircle className="h-3.5 w-3.5 text-destructive" />;
		default:
			return null;
	}
}

type ActiveFolder = { id: string | null; name: string } | null;

export function DocumentsExplorer({
	organizationId,
	organizationSlug,
	projectId,
}: DocumentsExplorerProps) {
	const t = useTranslations("projects.documents");
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const queryClient = useQueryClient();

	const [active, setActive] = useState<ActiveFolder>(null); // null = الجذر
	const [search, setSearch] = useState("");
	const [viewerDoc, setViewerDoc] = useState<any>(null);

	// dialogs
	const [uploadOpen, setUploadOpen] = useState(false);
	const [folderFormOpen, setFolderFormOpen] = useState(false);
	const [editingFolder, setEditingFolder] = useState<
		{ id: string; name: string; color?: string | null } | null
	>(null);
	const [deleteTarget, setDeleteTarget] = useState<
		{ id: string; name: string; documentCount: number } | null
	>(null);

	const isSearching = search.trim().length > 0;
	const inFolder = active !== null;
	// عرض قائمة الملفات عند: داخل مجلد، أو أثناء البحث
	const showFiles = inFolder || isSearching;

	// ── المجلدات ──
	const foldersQuery = useQuery(
		orpc.projectDocuments.listFolders.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// ── الملفات (حسب السياق) ──
	const documentsInput = useMemo(() => {
		if (isSearching) {
			return { organizationId, projectId, search: search.trim() };
		}
		if (inFolder) {
			return active!.id
				? { organizationId, projectId, folderId: active!.id }
				: { organizationId, projectId, uncategorized: true };
		}
		return { organizationId, projectId };
	}, [organizationId, projectId, isSearching, search, inFolder, active]);

	const documentsQuery = useQuery({
		...orpc.projectDocuments.list.queryOptions({ input: documentsInput as any }),
		enabled: showFiles,
	});

	const deleteDocMutation = useMutation(
		orpc.projectDocuments.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("deleteSuccess"));
				queryClient.invalidateQueries({ queryKey: [["projectDocuments", "list"]] });
				queryClient.invalidateQueries({ queryKey: [["projectDocuments", "listFolders"]] });
			},
			onError: (error: any) => toast.error(error.message || t("deleteError")),
		}),
	);

	const downloadUrlMutation = useMutation(
		orpc.projectDocuments.getDownloadUrl.mutationOptions({}),
	);

	const handleDownload = useCallback(
		async (doc: any) => {
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
		},
		[downloadUrlMutation, organizationId, projectId, t],
	);

	const handleDeleteDoc = useCallback(
		(docId: string) => {
			if (!confirm(t("deleteConfirm"))) return;
			deleteDocMutation.mutate({ organizationId, projectId, documentId: docId });
		},
		[deleteDocMutation, organizationId, projectId, t],
	);

	const folders = foldersQuery.data?.folders ?? [];
	const uncategorizedCount = foldersQuery.data?.uncategorizedCount ?? 0;
	const docs = documentsQuery.data?.items ?? [];

	const openNewFolder = () => {
		setEditingFolder(null);
		setFolderFormOpen(true);
	};
	const openEditFolder = (f: { id: string; name: string; color?: string | null }) => {
		setEditingFolder(f);
		setFolderFormOpen(true);
	};

	// ─────────────────────────── Render ───────────────────────────
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 min-w-0">
					{inFolder && !isSearching && (
						<Button
							variant="ghost"
							size="icon"
							className="rounded-xl shrink-0"
							onClick={() => setActive(null)}
						>
							<ChevronLeft className="h-5 w-5 rtl:rotate-180 text-muted-foreground" />
						</Button>
					)}
					<div className="min-w-0">
						<h1 className="truncate text-2xl font-semibold text-foreground">
							{isSearching
								? t("searchResults")
								: inFolder
									? active!.name
									: t("title")}
						</h1>
						{!isSearching && !inFolder && (
							<p className="text-sm text-muted-foreground">{t("explorerSubtitle")}</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{!inFolder && !isSearching && (
						<Button variant="outline" className="rounded-xl" onClick={openNewFolder}>
							<FolderPlus className="h-4 w-4 me-2" />
							{t("newFolder")}
						</Button>
					)}
					<Button
						className="rounded-xl"
						onClick={() => setUploadOpen(true)}
					>
						<Upload className="h-4 w-4 me-2" />
						{t("uploadFile")}
					</Button>
				</div>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder={t("searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-lg border border-input bg-card py-2.5 pe-4 ps-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			</div>

			{/* ─── Folder grid (root, not searching) ─── */}
			{!showFiles && (
				<>
					{foldersQuery.isLoading ? (
						<div className="flex flex-col gap-2">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="h-16 animate-pulse rounded-xl border-2 bg-card"
								/>
							))}
						</div>
					) : folders.length === 0 && uncategorizedCount === 0 ? (
						<EmptyState
							t={t}
							onNewFolder={openNewFolder}
							onUpload={() => setUploadOpen(true)}
						/>
					) : (
						<div className="flex flex-col gap-2">
							{folders.map((f) => {
								const c = folderColor(f.color);
								return (
									<div
										key={f.id}
										className="group relative flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-card p-3 transition-all hover:border-primary/40"
										onClick={() => setActive({ id: f.id, name: f.name })}
									>
										<span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.bg)}>
											<Folder className={cn("h-5 w-5", c.icon)} />
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-card-foreground">
												{f.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{t("filesCount", { count: f.documentCount })}
											</p>
										</div>
										<div
											className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
											onClick={(e) => e.stopPropagation()}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
														<MoreVertical className="h-3.5 w-3.5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEditFolder(f)}>
														<Pencil className="h-4 w-4 me-2" />
														{t("renameFolder")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() =>
															setDeleteTarget({
																id: f.id,
																name: f.name,
																documentCount: f.documentCount,
															})
														}
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

							{/* بطاقة "غير مصنّفة" */}
							{uncategorizedCount > 0 && (
								<div
									className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed bg-card p-3 transition-all hover:border-primary/40"
									onClick={() => setActive({ id: null, name: t("uncategorized") })}
								>
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
										<FolderOpen className="h-5 w-5 text-muted-foreground" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-card-foreground">
											{t("uncategorized")}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("filesCount", { count: uncategorizedCount })}
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</>
			)}

			{/* ─── Files list (in folder / search) ─── */}
			{showFiles && (
				<>
					{documentsQuery.isLoading ? (
						<div className="flex flex-col gap-2">
							{Array.from({ length: 8 }).map((_, i) => (
								<div
									key={i}
									className="h-16 animate-pulse rounded-xl border-2 bg-card"
								/>
							))}
						</div>
					) : docs.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border-2 bg-card py-16">
							<div className="mb-4 rounded-2xl bg-muted p-4">
								<FolderOpen className="h-12 w-12 text-muted-foreground" />
							</div>
							<p className="mb-2 text-lg font-medium text-card-foreground">
								{isSearching ? t("noSearchResults") : t("noDocuments")}
							</p>
							{!isSearching && (
								<Button className="mt-2 rounded-xl" onClick={() => setUploadOpen(true)}>
									<Upload className="h-4 w-4 me-2" />
									{t("uploadFile")}
								</Button>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{docs.map((doc: any) => {
								const { icon: FileIcon, bg, color } = getFileTypeStyle(doc.fileName, doc.mimeType);
								return (
									<div
										key={doc.id}
										className="group relative flex items-center gap-3 rounded-xl border-2 bg-card p-3 transition-all hover:border-primary/40"
									>
										<button
											type="button"
											onClick={() => setViewerDoc(doc)}
											className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg)}
										>
											<FileIcon className={cn("h-5 w-5", color)} />
										</button>
										<button
											type="button"
											onClick={() => setViewerDoc(doc)}
											className="min-w-0 flex-1 text-start"
										>
											<p className="truncate text-sm font-medium text-card-foreground group-hover:text-primary">
												{doc.title}
											</p>
											<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
												{isSearching && doc.folderRef && (
													<>
														<Badge className="border-0 bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
															{doc.folderRef.name}
														</Badge>
														<span className="text-muted-foreground">•</span>
													</>
												)}
												{doc.fileSize ? <span>{formatFileSize(doc.fileSize)}</span> : null}
											</div>
										</button>
										{doc.approvals?.[0] && (
											<div className="shrink-0">{approvalBadge(doc.approvals[0].status)}</div>
										)}
										<div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
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
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => handleDeleteDoc(doc.id)}
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
				</>
			)}

			{/* Viewer */}
			{viewerDoc && (
				<DocumentViewer
					organizationId={organizationId}
					projectId={projectId}
					document={viewerDoc}
					open={!!viewerDoc}
					onClose={() => setViewerDoc(null)}
				/>
			)}

			{/* Dialogs */}
			<UploadDocumentDialog
				organizationId={organizationId}
				projectId={projectId}
				folderId={inFolder ? active!.id : null}
				folderName={inFolder ? active!.name : undefined}
				open={uploadOpen}
				onOpenChange={setUploadOpen}
			/>
			<FolderFormDialog
				organizationId={organizationId}
				projectId={projectId}
				open={folderFormOpen}
				onOpenChange={setFolderFormOpen}
				folder={editingFolder}
			/>
			<DeleteFolderDialog
				organizationId={organizationId}
				projectId={projectId}
				folder={deleteTarget}
				open={!!deleteTarget}
				onOpenChange={(v) => !v && setDeleteTarget(null)}
				onDeleted={() => {
					// إذا كنا داخل المجلد المحذوف، عُد للجذر
					if (active && deleteTarget && active.id === deleteTarget.id) {
						setActive(null);
					}
				}}
			/>
		</div>
	);
}

function EmptyState({
	t,
	onNewFolder,
	onUpload,
}: {
	t: ReturnType<typeof useTranslations>;
	onNewFolder: () => void;
	onUpload: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border-2 bg-card py-16">
			<div className="mb-4 rounded-2xl bg-muted p-4">
				<FolderOpen className="h-12 w-12 text-muted-foreground" />
			</div>
			<p className="mb-1 text-lg font-medium text-card-foreground">
				{t("noFolders")}
			</p>
			<p className="mb-6 text-sm text-muted-foreground">{t("noFoldersDescription")}</p>
			<div className="flex gap-2">
				<Button variant="outline" className="rounded-xl" onClick={onNewFolder}>
					<FolderPlus className="h-4 w-4 me-2" />
					{t("newFolder")}
				</Button>
				<Button className="rounded-xl" onClick={onUpload}>
					<Upload className="h-4 w-4 me-2" />
					{t("uploadFile")}
				</Button>
			</div>
		</div>
	);
}
