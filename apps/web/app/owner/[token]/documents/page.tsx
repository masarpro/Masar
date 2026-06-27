"use client";

import { DocumentViewer } from "@saas/projects/components/documents/DocumentViewer";
import {
	formatFileSize,
	getFileTypeStyle,
} from "@saas/projects/components/documents/file-icons";
import { useOwnerSession } from "@saas/projects-owner/hooks/use-owner-session";
import { OWNER_QUERY_FRESHNESS } from "@saas/projects-owner/lib/query-freshness";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	ChevronLeft,
	Folder,
	FolderOpen,
	Search,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

const FOLDER_COLOR_MAP: Record<string, { bg: string; icon: string }> = {
	slate: { bg: "bg-slate-100 dark:bg-slate-800", icon: "text-slate-500" },
	blue: { bg: "bg-blue-100 dark:bg-blue-950/40", icon: "text-blue-500" },
	purple: { bg: "bg-purple-100 dark:bg-purple-950/40", icon: "text-purple-500" },
	green: { bg: "bg-green-100 dark:bg-green-950/40", icon: "text-green-500" },
	amber: { bg: "bg-amber-100 dark:bg-amber-950/40", icon: "text-amber-600" },
	pink: { bg: "bg-pink-100 dark:bg-pink-950/40", icon: "text-pink-500" },
	cyan: { bg: "bg-cyan-100 dark:bg-cyan-950/40", icon: "text-cyan-600" },
	red: { bg: "bg-red-100 dark:bg-red-950/40", icon: "text-red-500" },
};

function folderColor(color?: string | null) {
	return FOLDER_COLOR_MAP[color ?? "slate"] ?? FOLDER_COLOR_MAP.slate;
}

type ActiveFolder = { id: string | null; name: string } | null;

export default function OwnerPortalDocuments() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const sessionToken = useOwnerSession();
	const authInput = sessionToken ? { sessionToken } : { token };

	const [active, setActive] = useState<ActiveFolder>(null);
	const [search, setSearch] = useState("");
	const [viewerDoc, setViewerDoc] = useState<any>(null);

	const isSearching = search.trim().length > 0;
	const inFolder = active !== null;
	const showFiles = inFolder || isSearching;

	const foldersQuery = useQuery(
		orpc.projectOwner.portal.listFolders.queryOptions({
			input: authInput,
			...OWNER_QUERY_FRESHNESS,
		}),
	) as {
		data:
			| {
					folders: {
						id: string;
						name: string;
						color: string | null;
						documentCount: number;
					}[];
					uncategorizedCount: number;
			  }
			| undefined;
		isLoading: boolean;
	};

	const documentsInput = useMemo(() => {
		if (isSearching) return { ...authInput, search: search.trim() };
		if (inFolder) {
			return active!.id
				? { ...authInput, folderId: active!.id }
				: { ...authInput, uncategorized: true };
		}
		return authInput;
	}, [authInput, isSearching, search, inFolder, active]);

	const documentsQuery = useQuery({
		...orpc.projectOwner.portal.listDocuments.queryOptions({
			input: documentsInput as any,
			...OWNER_QUERY_FRESHNESS,
		}),
		enabled: showFiles,
	}) as { data: { items: any[] } | undefined; isLoading: boolean };

	const downloadMutation = useMutation(
		orpc.projectOwner.portal.getDocumentDownloadUrl.mutationOptions({}) as any,
	);

	const resolveUrl = useCallback(
		async (documentId: string) => {
			const res = await (downloadMutation as any).mutateAsync({
				...authInput,
				documentId,
			});
			return res.downloadUrl as string;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sessionToken, token],
	);

	const folders = foldersQuery.data?.folders ?? [];
	const uncategorizedCount = foldersQuery.data?.uncategorizedCount ?? 0;
	const docs = documentsQuery.data?.items ?? [];

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div className="flex items-center gap-2">
				{inFolder && !isSearching && (
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 rounded-xl"
						onClick={() => setActive(null)}
					>
						<ChevronLeft className="h-5 w-5 rtl:rotate-180 text-slate-500" />
					</Button>
				)}
				<div className="min-w-0">
					<h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
						{isSearching
							? t("ownerPortal.documents.searchResults")
							: inFolder
								? active!.name
								: t("ownerPortal.documents.title")}
					</h2>
					{!showFiles && (
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("ownerPortal.documents.subtitle")}
						</p>
					)}
				</div>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					placeholder={t("ownerPortal.documents.searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-4 ps-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
				/>
			</div>

			{/* ─── Folder list ─── */}
			{!showFiles &&
				(foldersQuery.isLoading ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 rounded-xl" />
						))}
					</div>
				) : folders.length === 0 && uncategorizedCount === 0 ? (
					<EmptyState
						title={t("ownerPortal.documents.empty")}
						hint={t("ownerPortal.documents.emptyHint")}
					/>
				) : (
					<div className="flex flex-col gap-2">
						{folders.map((f) => {
							const c = folderColor(f.color);
							return (
								<button
									key={f.id}
									type="button"
									onClick={() => setActive({ id: f.id, name: f.name })}
									className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition-all hover:border-primary/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
								>
									<span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.bg)}>
										<Folder className={cn("h-5 w-5", c.icon)} />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-slate-900 dark:text-slate-100">
											{f.name}
										</p>
										<p className="text-xs text-slate-500">
											{t("ownerPortal.documents.filesCount", { count: f.documentCount })}
										</p>
									</div>
									<ChevronLeft className="h-4 w-4 shrink-0 rtl:rotate-180 text-slate-300 transition-colors group-hover:text-primary" />
								</button>
							);
						})}

						{uncategorizedCount > 0 && (
							<button
								type="button"
								onClick={() => setActive({ id: null, name: t("ownerPortal.documents.uncategorized") })}
								className="group flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-start transition-all hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900/50"
							>
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800">
									<FolderOpen className="h-5 w-5 text-slate-400" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-slate-700 dark:text-slate-300">
										{t("ownerPortal.documents.uncategorized")}
									</p>
									<p className="text-xs text-slate-500">
										{t("ownerPortal.documents.filesCount", { count: uncategorizedCount })}
									</p>
								</div>
								<ChevronLeft className="h-4 w-4 shrink-0 rtl:rotate-180 text-slate-300 transition-colors group-hover:text-primary" />
							</button>
						)}
					</div>
				))}

			{/* ─── Files list ─── */}
			{showFiles &&
				(documentsQuery.isLoading ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-14 rounded-xl" />
						))}
					</div>
				) : docs.length === 0 ? (
					<EmptyState
						title={
							isSearching
								? t("ownerPortal.documents.noSearchResults")
								: t("ownerPortal.documents.empty")
						}
						hint=""
					/>
				) : (
					<div className="flex flex-col gap-2">
						{docs.map((doc: any) => {
							const { icon: FileIcon, bg, color } = getFileTypeStyle(doc.fileName, doc.mimeType);
							return (
								<button
									key={doc.id}
									type="button"
									onClick={() => setViewerDoc(doc)}
									className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition-all hover:border-primary/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
								>
									<span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg)}>
										<FileIcon className={cn("h-5 w-5", color)} />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary dark:text-slate-100">
											{doc.title}
										</p>
										<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
											{isSearching && doc.folderRef && (
												<>
													<Badge className="border-0 bg-slate-100 px-1.5 py-0 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
														{doc.folderRef.name}
													</Badge>
													<span className="text-slate-300">•</span>
												</>
											)}
											{doc.fileSize ? <span>{formatFileSize(doc.fileSize)}</span> : null}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				))}

			{/* Viewer (read-only) */}
			{viewerDoc && (
				<DocumentViewer
					document={viewerDoc}
					open={!!viewerDoc}
					onClose={() => setViewerDoc(null)}
					resolveUrl={resolveUrl}
				/>
			)}
		</div>
	);
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
				<FolderOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
			</div>
			<p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
			{hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
		</div>
	);
}
